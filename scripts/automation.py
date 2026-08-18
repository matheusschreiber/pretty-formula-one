import json
import logging
import os
from datetime import datetime

import boto3
import fastf1

logging.getLogger('fastf1').setLevel(logging.ERROR) # keep this to avoid log polution
import sys

from dotenv import load_dotenv

load_dotenv()

ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
REGION = os.getenv('AWS_REGION', 'us-east-1')
BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

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
        

def create_drivers_json(year):
    schedule_df = fastf1.get_event_schedule(year)
    races = schedule_df["RoundNumber"][schedule_df["RoundNumber"] > 0].tolist()
    drivers_list = []
    seen_drivers = set()
    print("\tFetching drivers for race ", end="", flush=True)
    for race in races:
        print(f"{race} ", end="", flush=True)
        session = fastf1.get_session(year, race, 'R')
        session.load(laps=False, telemetry=False, weather=False)
        for _, row in session.results.iterrows():
            driver_slug = f"{row['DriverId']}_{year}"
            if driver_slug not in seen_drivers:
                drivers_list.append({
                    "id": driver_slug,
                    "team": row["TeamName"],
                    "abbreviation": row["Abbreviation"],
                    "name": row["FullName"],
                    "teamLogo": f"/assets/icons/{row['TeamName'].lower().replace(' ', '-')}.png",
                    "photo": row["HeadshotUrl"].replace(".png.transform/1col/image.png",".png.transform/4col/image.png")
                })
                seen_drivers.add(driver_slug)
        print(" Done.")
    return drivers_list
    

def create_rounds_json(year): 
    rounds_json = []
    return rounds_json

    
def get_aws_files(s3_aws_client, year):
    print(f"Fetching files from AWS S3 for year {year}...")
    telemetries_csvs_filenames = []
    replays_json_filenames = []
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
            elif "telemetry_" in key and key.endswith('.csv'):
                telemetry_key = key.split('/')[-1]
                telemetries_csvs_filenames.append(telemetry_key)
            elif "replay_" in key and key.endswith('.json'):
                replay_key = key.split('/')[-1]
                replays_json_filenames.append(replay_key)
    print(f"Fetched {len(rounds_json)} rounds, {len(drivers_json)} drivers, {len(telemetries_csvs_filenames)} telemetry files, and {len(replays_json_filenames)} replay files from AWS S3 for year {year}.")
    return rounds_json, drivers_json, telemetries_csvs_filenames, replays_json_filenames


def upload_to_aws(client, file_content, folder, filename):
    data_type = {
        "json": "application/json",
        "csv": "text/csv"
    }
    client.put_object(
        Bucket=BUCKET_NAME, 
        Key=f"{folder}/{filename}", 
        Body=file_content,
        ContentType=data_type[filename.split('.')[-1]],
    )
    print(f"Uploaded {filename} to AWS S3 bucket {BUCKET_NAME}.")


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


def fix_files_metadata(s3_aws_client):
    paginator = s3_aws_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix="")
    updated_count = 0
    skipped_count = 0
    for page in pages:
        if "Contents" not in page:
            continue
        for obj in page["Contents"]:
            key = obj["Key"]
            if key.endswith(".json"):
                head = s3_aws_client.head_object(Bucket=BUCKET_NAME, Key=key)
                current_content_type = head.get("ContentType")
                current_content_disp = head.get("ContentDisposition")
                needs_update = (
                    current_content_type != "application/json"
                    or current_content_disp != "inline"
                )
                if needs_update:
                    print(
                        f"Updating metadata for: {key} "
                        f"(Current: Type='{current_content_type}', Disposition='{current_content_disp}')"
                    )
                    s3_aws_client.copy_object(
                        Bucket=BUCKET_NAME,
                        Key=key,
                        CopySource={"Bucket": BUCKET_NAME, "Key": key},
                        ContentType="application/json",
                        ContentDisposition="inline",
                        MetadataDirective="REPLACE",
                    )
                    updated_count += 1
                else:
                    print(f"Skipping {key} (Metadata already correct)")
                    skipped_count += 1

    print(f"\nFinished! Updated: {updated_count}, Skipped: {skipped_count}")
    

def get_unprocessed_round_driver_telemetry(available_rounds, driver_id, telemetries_csvs_filenames):
    driver_rounds_filenames = [f for f in telemetries_csvs_filenames if f.startswith(f'telemetry_{driver_id}_')]
    processed_rounds = [int(f.split(f'_{driver_id}_')[1].split('.')[0]) for f in driver_rounds_filenames]
    unprocessed_rounds = [r for r in available_rounds if r not in processed_rounds]
    return unprocessed_rounds


def get_unprocessed_round_replay(available_rounds, replays_json_filenames):
    processed_rounds = {int(f.split('_race_')[1].split('_lap_')[0]) for f in replays_json_filenames}
    unprocessed_rounds = [r for r in available_rounds if r not in processed_rounds]
    return unprocessed_rounds


if __name__ == "__main__":
    
    print(f"Connecting to AWS S3 bucket {BUCKET_NAME}...", end="", flush=True)
    
    s3_aws_client = boto3.client(
        's3',
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
        region_name=REGION
    )
    
    print(" [Connected]")
    
    year = datetime.now().year  # noqa: DTZ005
    
    print(f"Starting automation script for year {year}...")
    
    available_rounds = get_available_rounds(year)
    if not available_rounds:
        print(f"No available rounds found for year {year}. Exiting.")
        sys.exit(0)
        
    print(f"Available rounds for year {year}: {available_rounds}")
    
    print(f"Fetching existing rounds and drivers JSON from AWS S3 for year {year}...")
    
    rounds_json, drivers_json, telemetries_csvs_filenames, replays_json_filenames = get_aws_files(s3_aws_client, year)
    rounds_json = rounds_json if rounds_json else create_rounds_json(year)
    
    print(f"Processing drivers data for year {year}...")
    
    if not drivers_json:
        print(f"No existing drivers JSON found for year {year}. Creating new drivers JSON...")
        drivers_json = create_drivers_json(year)
        upload_to_aws(
            client=s3_aws_client,
            file_content=json.dumps(drivers_json),
            folder=year, 
            filename=f"drivers_{year}.json"
        )
        print(f"Created and uploaded new drivers JSON for year {year} to AWS S3.")
    else:
        print(f"Existing drivers JSON found for year {year}.")
    
    print(f"Processing rounds data for year {year}...")
    
    processed_rounds = [r['index'] for r in rounds_json]
    rounds_to_process = [r for r in available_rounds if r not in processed_rounds]
    if rounds_to_process:
        rounds_json = update_rounds_json(drivers_json, rounds_json, year, rounds_to_process)
        upload_to_aws(
            client=s3_aws_client,
            file_content=json.dumps(rounds_json),
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
        rounds_to_process = get_unprocessed_round_driver_telemetry(available_rounds, driver["id"], telemetries_csvs_filenames)
        print(f"\nDriver {driver['id']} - Missing rounds: {rounds_to_process}")
        for r in rounds_to_process:
            telemetry = get_new_telemetry_csv(year, driver["id"], r)
            if telemetry is None:
                # print(f"No telemetry data available for driver {driver['id']} in round {r} {year}.")
                continue
            else:
                print(len(telemetry.splitlines()), f"lines of telemetry data for driver {driver['id']} in round {r} {year}.")
            upload_to_aws(
                client=s3_aws_client,
                file_content=telemetry,
                folder=f"{year}/telemetries/race_{r}",
                filename=f"telemetry_{driver['id']}_{r}.csv"
            )
            print()
    
    print("-"*40)
    print(f"Updated telemetry data for year {year} has been uploaded to AWS S3.")
    print("-"*40)
    
    print(f"Processing replay data for year {year}...")
    
    rounds_to_process = get_unprocessed_round_replay(available_rounds, replays_json_filenames)
    for race in rounds_to_process:
        
        print(f"Processing race {race}...")
        
        session = fastf1.get_session(year, race, "R")
        session.load(laps=True, telemetry=True, weather=False)
        lap_replays = [[] for _ in range(session.total_laps)]
        
        for idx, driver in enumerate(drivers_json):
            driver_slug = driver["id"]
            driver_laps = session.laps.pick_drivers(driver["abbreviation"])
            if driver_laps.empty:
                print(f"\tNo laps found for driver {driver_slug} in race {race}. Skipping replay data for this driver.")
                continue
            
            print(f"\tProcessing driver [{idx+1}/{len(drivers_json)}] {driver_slug}...........", end="", flush=True)
            
            best_sectors = [float('inf'), float('inf'), float('inf')]
            best_lap_time = float('inf')
            
            for driver_lap in driver_laps.iterlaps():            
                lap_telemetry = driver_lap[1].get_telemetry()
                lap_number = int(driver_lap[1]['LapNumber'])
                
                best_sectors = [
                    min(best_sectors[0], driver_lap[1]['Sector1Time'].total_seconds()),
                    min(best_sectors[1], driver_lap[1]['Sector2Time'].total_seconds()),
                    min(best_sectors[2], driver_lap[1]['Sector3Time'].total_seconds()),
                ]
                
                best_sectors = [0.0 if bs == float('inf') else bs for bs in best_sectors]
                
                best_lap_time = min(best_lap_time, driver_lap[1]['LapTime'].total_seconds())
                
                for _, row in lap_telemetry.iterrows():   
                    lap_replays[lap_number - 1].append({
                        "driver": driver_slug,
                        "lap_number": lap_number,
                        "x": round(row['X'], 2),
                        "y": round(row['Y'], 2),
                        "z": round(row['Z'], 2),
                        "time": row['Time'].total_seconds(),
                        "position": driver_lap[1]['Position'], 
                        "compound": driver_lap[1]['Compound'],
                        "tyre_life": driver_lap[1]['TyreLife'],
                        "gap_to_leader": 0, # TODO:
                        "gap_to_front": 0, # TODO:
                        "current_best_lap_time": best_lap_time,
                        "last_lap_time": driver_lap[1]['LapTime'].total_seconds(),
                        "current_sector_times": [
                            driver_lap[1]['Sector1Time'].total_seconds() if driver_lap[1]['Sector1Time'].total_seconds() > 0 else 0.0,
                            driver_lap[1]['Sector2Time'].total_seconds() if driver_lap[1]['Sector2Time'].total_seconds() > 0 else 0.0,
                            driver_lap[1]['Sector3Time'].total_seconds() if driver_lap[1]['Sector3Time'].total_seconds() > 0 else 0.0,
                        ],
                        "best_sector_time": best_sectors,
                        "is_in_pit": type(driver_lap[1]["PitInTime"].total_seconds()) is float, # TODO:
                        "is_retired": False, # TODO:
                    })
            
            print("[done]", flush=True)
            
        for idx, lap_replay in enumerate(lap_replays):
            lap_replay.sort(key=lambda x: x['time'])
            filename = f'data/{year}/replays/race_{race}/replay_{year}_race_{race}_lap_{idx+1}.json'
            
            upload_to_aws(
                client=s3_aws_client,
                file_content=lap_replay,
                folder=f"{year}/replays/race_{race}",
                filename=f"replay_{year}_race_{race}_lap_{idx+1}.json"
            )
            
        print(f"Finished processing replay data for race {race}.")
    
    print("-"*40)
    print(f"Updated replay data for year {year} has been uploaded to AWS S3.")
    print("-"*40)