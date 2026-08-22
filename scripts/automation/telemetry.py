from datetime import datetime

import fastf1

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005

def get_unprocessed_round_driver_telemetry(available_rounds, driver_id, telemetries_csvs_filenames):
    driver_rounds_filenames = [f for f in telemetries_csvs_filenames if f.startswith(f'telemetry_{driver_id}_')]
    processed_rounds = [int(f.split(f'_{driver_id}_')[1].split('.')[0]) for f in driver_rounds_filenames]
    unprocessed_rounds = [r for r in available_rounds if r not in processed_rounds]
    return unprocessed_rounds


def get_new_telemetry_csv(year, driver_id, round_id):
    
    print(f"Fetching telemetry for driver {driver_id} in round {round_id} {year}...")
    session = fastf1.get_session(year, round_id, "R")
    session.load(laps=True, telemetry=True, weather=False)
    driver_abv = None
    for _, row in session.results.iterrows():
        if row["DriverId"] == driver_id.replace(f"_{year}", ""):
            driver_abv = row["Abbreviation"]
            break
    if driver_abv is None:
        print(f"Driver {driver_id} not found in round {round_id} {year}.")
        return None
    driver_laps = session.laps.pick_drivers(driver_abv)
    if driver_laps.empty:
        print(f"No laps found for driver {driver_id} in round {round_id} {year}.")
        return None
    fastest_lap = driver_laps.pick_fastest()
    if fastest_lap is None:
        fastest_lap = driver_laps.iloc[0]
    start_td = fastest_lap["Time"] - fastest_lap["LapTime"]
    try:
        telemetry = fastest_lap.get_telemetry()
    except Exception as e:  # noqa: BLE001
        print(f"No telemetry data for driver {driver_id} in round {round_id} {year}. Exception: {e}")
        return None
    telemetry['RelativeSeconds'] = (telemetry['SessionTime'] - start_td).dt.total_seconds()
    telemetry['Compound'] = fastest_lap['Compound']

    print(f"Compiling telemetry data for driver {driver_id} in round {round_id} {year}...")
    
    position_points = []
    for row in telemetry.itertuples():
        position_points.append((
            round(row.RelativeSeconds,3), 
            round(row.X,1), 
            round(row.Y,1),
            round(row.Z,1),
            round(row.RPM,1),
            round(row.Speed,1), 
            row.nGear, 
            round(row.Throttle,1), 
            row.Brake, 
            row.DRS, 
            row.Status,
            row.Compound
        ))

    csv_content = "seconds,x,y,z,rpm,speed,gear,throttle,brake,drs,status,compound\n"
    for point in position_points:
        csv_content += ','.join(map(str, point)) + '\n'
        
    return csv_content