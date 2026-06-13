import fastf1
import boto3
import json
import os
import logging 
logging.getLogger('fastf1').setLevel(logging.ERROR) # keep this to avoid log polution
from dotenv import load_dotenv
load_dotenv()

ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
REGION = os.getenv('AWS_REGION', 'us-east-1')
BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

def update_rounds_json(drivers_json, rounds_json, rounds_to_process):
    
    year = rounds_json[0]["year"]
    if not year:
        raise ValueError("Year not found in rounds_json.")
    
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
            except Exception:
                print(f"No sprint session data available for round {round_id}.")
                pass

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
                    "tyre_strat": lap_tyre_data.get(d_number, [])
                })

            event_info = race_session.event
            country = event_info["Country"]
            schedule_df = fastf1.get_event_schedule(year)
            rounds_list = schedule_df["RoundNumber"][schedule_df["RoundNumber"] > 0].tolist()
            total_rounds = len(rounds_list)

            round_data = {
                "id": int(event_info["RoundNumber"]),
                "year": year,
                "index": int(event_info["RoundNumber"]),
                "totalRounds": total_rounds,
                "name": event_info["EventName"],
                "nameVerbose": event_info["OfficialEventName"],
                "country": country,
                "backgroundImage": f"/assets/circuits/{country.lower().replace(' ', '_')}.png",
                "results": sorted(race_results_list, key=lambda x: x["racePoints"], reverse=True),
            }

            rounds_json.append(round_data)
            rounds_json.sort(key=lambda x: x["id"])
            return rounds_json

        except Exception as e:
            print(f"Error processing round {round_id}: {e}")
            break
        
    return None

    
def get_aws_files(s3_aws_client, year):
    print(f"Fetching files from AWS S3 for year {year}...")
    telemetries_csvs_filenames = []
    rounds_json = {}
    drivers_json = {}
    
    paginator = s3_aws_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET_NAME):
        for file in page.get('Contents', []):
            key = file['Key']
            if key.endswith(f'rounds_{year}.json'):
                rounds_obj = s3_aws_client.get_object(Bucket=BUCKET_NAME, Key=key)
                rounds_json = json.loads(rounds_obj['Body'].read().decode('utf-8'))
            elif key.endswith(f'drivers_{year}.json'):
                drivers_obj = s3_aws_client.get_object(Bucket=BUCKET_NAME, Key=key)
                drivers_json = json.loads(drivers_obj['Body'].read().decode('utf-8'))
            elif key.startswith(f'{year}/telemetry_') and key.endswith('.csv'):
                telemetry_key = key.split(f'{year}/')[1]
                telemetries_csvs_filenames.append(telemetry_key)
    print(f"Fetched {len(rounds_json)} rounds, {len(drivers_json)} drivers, and {len(telemetries_csvs_filenames)} telemetry files from AWS S3 for year {year}.")
    return rounds_json, drivers_json, telemetries_csvs_filenames


def get_last_round(rounds_json):
    if not rounds_json:
        return 0
    last_round = max(r['index'] for r in rounds_json)
    return last_round


def upload_to_aws(client, file_content, folder, filename):
    client.put_object(
        Bucket=BUCKET_NAME, 
        Key=f"{folder}/{filename}", 
        Body=file_content
    )
    print(f"Uploaded {filename} to AWS S3 bucket {BUCKET_NAME}.")
    
    
def get_last_round_driver(year, driver_id, telemetries_csvs_filenames):
    driver_files = [f for f in telemetries_csvs_filenames if f.startswith(f'telemetry_{driver_id}_')]
    if not driver_files:
        return 0
    last_round_driver = max(int(f.split(f'_{year}_')[1].split('.')[0]) for f in driver_files)
    return last_round_driver


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
    except Exception as e:
        print(f"No telemetry data for driver {driver_id} in round {round_id} {year}. Exception: {e}")
        return None
    telemetry['RelativeSeconds'] = (telemetry['SessionTime'] - start_td).dt.total_seconds()
    telemetry['Compound'] = fastest_lap['Compound']

    print(f"Compiling telemetry data for driver {driver_id} in round {round_id} {year}...")
    
    position_points = []
    for row in telemetry.itertuples():
        position_points.append((
            round(row.RelativeSeconds,1), 
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
        except Exception as ex:
            print(ex)
            break
    return available_rounds
    

if __name__ == "__main__":
    
    year = 2026
    
    print(f"Starting automation script for year {year}...")
    
    available_rounds = get_available_rounds(year)
    if not available_rounds:
        print(f"No available rounds found for year {year}. Exiting.")
        exit(0)
        
    print(f"Available rounds for year {year}: {available_rounds}")
    
    s3_aws_client = boto3.client(
        's3',
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name=REGION
    )
    
    rounds_json, drivers_json, telemetries_csvs_filenames = get_aws_files(s3_aws_client, year)
    last_round = get_last_round(rounds_json)
    rounds_to_process = [r for r in available_rounds if r > last_round]
    if rounds_to_process:
        rounds_json = update_rounds_json(drivers_json, rounds_json, rounds_to_process)
        upload_to_aws(
            client=s3_aws_client,
            file_content=rounds_json, 
            folder=year, 
            filename=f"rounds_{year}.json"
        )
        
        print("-"*40)
        print(f"Updated rounds JSON for year {year} has been uploaded to AWS S3.")
        print("-"*40)
    else:
        print("-"*40)
        print(f"All rounds for year {year} have been processed. Exiting.")
        print("-"*40)
        
    print(f"Processing telemetry data for year {year}...")

    for driver in drivers_json:
        last_round_driver = get_last_round_driver(year, driver["id"], telemetries_csvs_filenames)
        unprocessed_rounds = [r for r in available_rounds if r > last_round_driver]
        print(f"\nDriver {driver['id']} - Missing rounds: {unprocessed_rounds}")
        for r in unprocessed_rounds:
            telemetry = get_new_telemetry_csv(year, driver["id"], r)
            if telemetry is None:
                continue
            print(len(telemetry.splitlines()), f"lines of telemetry data for driver {driver['id']} in round {r} {year}.")
            upload_to_aws(
                client=s3_aws_client,
                file_content=telemetry,
                folder=year,
                filename=f"telemetry_{driver['id']}_{r}.csv"
            )
    
    print("-"*40)
    print(f"Updated telemetry data for year {year} has been uploaded to AWS S3.")
    print("-"*40)