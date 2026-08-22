from datetime import datetime

import fastf1

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005

def create_rounds_json(year): 
    rounds_json = []
    return rounds_json


def get_available_rounds(year):
    schedule_df = fastf1.get_event_schedule(year)
    rounds = schedule_df["RoundNumber"][schedule_df["RoundNumber"] > 0].tolist()
    available_rounds = []
    for round_id in rounds:
        try:
            print(f"\tChecking availability for round {round_id}...", end="", flush=True)
            session = fastf1.get_session(year, round_id, "R")
            session.load(telemetry=False, weather=False, laps=False, messages=False)
            if session.results.empty:
                print(" [Not Available]")
                break
            available_rounds.append(round_id)
            print(" [Available]")
        except Exception as ex:  # noqa: BLE001
            print(ex)
            break
    return available_rounds


def update_rounds_json(drivers_json, rounds_json, year, rounds_to_process):
    
    if not year:
        raise ValueError("Year not provided.")
    
    print(f"Rounds to process for year {year}: {rounds_to_process}")
    
    for round_id in rounds_to_process:
        try:
            print(f"Fetching session data for round {round_id}...")
            
            race_session = fastf1.get_session(year, round_id, "R")
            race_session.load(telemetry=False, weather=False)
            
            race_points_map = {
                f"{row['DriverId']}_{year}": int(row['Points']) 
                for _, row in race_session.results.iterrows()
            }

            id_to_number_map = {
                f"{row['DriverId']}_{year}": row['DriverNumber'] 
                for _, row in race_session.results.iterrows()
            }
            
            retired_drivers = [
                f"{row['DriverId']}_{year}" 
                for _, row in race_session.results.iterrows()
                if row['Status'] not in ['Finished', 'Lapped']
            ]
            
            sprint_points_map = {}
            has_sprint = False
            try:
                print(f"Fetching sprint session data for round {round_id}...")
                sprint_session = fastf1.get_session(year, round_id, "S")
                sprint_session.load(laps=False, telemetry=False, weather=False)
                has_sprint = True
                sprint_points_map = {
                    row['DriverNumber']: int(row['Points']) 
                    for _, row in sprint_session.results.iterrows()
                }
            except Exception:  # noqa: BLE001
                print(f"No sprint session data available for round {round_id}.")

            print(f"Compiling race and drivers data for round {round_id}...")
            
            race_results_list = []
            for driver in drivers_json:
                d_id = driver["id"]
                r_points = race_points_map.get(d_id, 0)
                s_points = 0
                d_number = id_to_number_map.get(d_id)
                
                if has_sprint and d_number:
                    s_points = sprint_points_map.get(d_number, 0)
                        
                laps = race_session.laps
                tyre_data = laps[['Compound', 'LapNumber', 'DriverNumber', 'Stint']]
                lap_tyre_data = {}
                
                for _, row in tyre_data.iterrows():
                    if str(row["Compound"]) == "nan":
                        continue
                    driver_num = row["DriverNumber"]
                    if driver_num not in lap_tyre_data:
                        lap_tyre_data[driver_num] = []
                    
                    last_entry = lap_tyre_data[driver_num][-1] if lap_tyre_data[driver_num] else None
                    if last_entry and row["Compound"] == last_entry["compound"]:
                        last_entry["lapEnd"] = int(row["LapNumber"])
                    else:
                        lap_tyre_data[driver_num].append({
                            "compound": row["Compound"],
                            "lapStart": int(row["LapNumber"]),
                            "lapEnd": int(row["LapNumber"]),
                            "stint": int(row["Stint"])
                        })

                race_results_list.append({
                    "driver_id": d_id,
                    "racePoints": r_points,
                    "sprintPoints": s_points,
                    "tyreStrat": lap_tyre_data.get(d_number, []),
                    "retired": d_id in retired_drivers
                })

            event_info = race_session.event
            country = event_info["Country"]
            schedule_df = fastf1.get_event_schedule(year)
            rounds_list = schedule_df["RoundNumber"][schedule_df["RoundNumber"] > 0].tolist()
            total_rounds = len(rounds_list)
            
            sorted_results = sorted(race_results_list, key=lambda x: x["racePoints"] - (1000 if x['retired'] else 0), reverse=True) 

            round_data = {
                "id": int(event_info["RoundNumber"]),
                "year": year,
                "index": int(event_info["RoundNumber"]),
                "totalRounds": total_rounds,
                "totalLaps": race_session.total_laps,
                "name": event_info["EventName"],
                "nameVerbose": event_info["OfficialEventName"],
                "country": country,
                "backgroundImage": f"/assets/circuits/{country.lower().replace(' ', '_')}.png",
                "results": sorted_results,
            }

            rounds_json.append(round_data)
            rounds_json.sort(key=lambda x: x["id"])

        except Exception as e:  # noqa: BLE001
            print(f"Error processing round {round_id}: {e}")
            break
    
    return rounds_json