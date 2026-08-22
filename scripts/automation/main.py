import argparse
import json
import logging
import os
from datetime import datetime

import boto3
from aws import get_aws_files, upload_to_aws
from drivers import create_drivers_json
from replay import create_replay_dataframes, get_unprocessed_round_replay
from rounds import (
    create_rounds_json,
    get_available_rounds,
    update_rounds_json,
)
from telemetry import (
    get_new_telemetry_csv,
    get_unprocessed_round_driver_telemetry,
)

logging.getLogger('fastf1').setLevel(logging.ERROR) # keep this to avoid log polution
import sys

from dotenv import load_dotenv

load_dotenv()

ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
REGION = os.getenv('AWS_REGION', 'us-east-1')
BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')     

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005

if __name__ == "__main__":
    
    parser = argparse.ArgumentParser(description="prettyf1 automation script")
    parser.add_argument("-d", "--no-driver", dest="dont_process_driver_data", action="store_false")
    parser.add_argument("-r", "--no-round", dest="dont_process_round_data", action="store_false")
    parser.add_argument("-t", "--no-telemetry", dest="dont_process_telemetry_data", action="store_false")
    parser.add_argument("-p", "--no-replay", dest="dont_process_replay_data", action="store_false")
    args = parser.parse_args()

    process_driver_data = args.dont_process_driver_data 
    process_round_data = args.dont_process_round_data
    process_telemetry_data = args.dont_process_telemetry_data
    process_replay_data = args.dont_process_replay_data
    
    print("Driver data processing:", process_driver_data)
    print("Round data processing:", process_round_data)
    print("Telemetry data processing:", process_telemetry_data)
    print("Replay data processing:", process_replay_data)
    
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
    
    rounds_json, drivers_json, telemetries_csvs_filenames, replays_parquet_filenames = get_aws_files(s3_aws_client, year, BUCKET_NAME)
    rounds_json = rounds_json if rounds_json else create_rounds_json(year)
    
    if process_driver_data:
        
        print(f"Processing drivers data for year {year}...")
        
        if not drivers_json:
            print(f"No existing drivers JSON found for year {year}. Creating new drivers JSON...")
            drivers_json = create_drivers_json(year)
            upload_to_aws(
                client=s3_aws_client,
                file_content=json.dumps(drivers_json),
                folder=year, 
                filename=f"drivers_{year}.json",
                BUCKET_NAME=BUCKET_NAME
            )
            print("-"*40)
            print(f"Created and uploaded new drivers JSON for year {year} to AWS S3.")
            print("-"*40)
        else:
            print("-"*40)
            print(f"Existing drivers JSON found for year {year}.")
            print("-"*40)
    
    if process_round_data:
    
        print(f"Processing rounds data for year {year}...")
        
        processed_rounds = [r['index'] for r in rounds_json]
        rounds_to_process = [r for r in available_rounds if r not in processed_rounds]
        if rounds_to_process:
            rounds_json = update_rounds_json(drivers_json, rounds_json, year, rounds_to_process)
            upload_to_aws(
                client=s3_aws_client,
                file_content=json.dumps(rounds_json),
                folder=year, 
                filename=f"rounds_{year}.json",
                BUCKET_NAME=BUCKET_NAME
            )
            
            print("-"*40)
            print(f"Updated rounds JSON for year {year} has been uploaded to AWS S3.")
            print("-"*40)
        else:
            print("-"*40)
            print(f"All rounds for year {year} have been processed. Exiting.")
            print("-"*40)
            
    if process_telemetry_data:
        
        print(f"Processing telemetry data for year {year}...")

        for driver in drivers_json:
            rounds_to_process = get_unprocessed_round_driver_telemetry(available_rounds, driver["id"], telemetries_csvs_filenames)
            print(f"\nDriver {driver['id']} - Missing rounds: {rounds_to_process}")
            for r in rounds_to_process:
                telemetry = get_new_telemetry_csv(year, driver["id"], r)
                if telemetry is None:
                    continue
                else:
                    print(len(telemetry.splitlines()), f"lines of telemetry data for driver {driver['id']} in round {r} {year}.")
                
                upload_to_aws(
                    client=s3_aws_client,
                    file_content=telemetry,
                    folder=f"{year}/telemetries/race_{r}",
                    filename=f"telemetry_{driver['id']}_{r}.csv",
                    BUCKET_NAME=BUCKET_NAME
                )
                print()
        
        print("-"*40)
        print(f"Updated telemetry data for year {year} has been uploaded to AWS S3.")
        print("-"*40)
        
    if process_replay_data:
    
        print(f"Processing replay data for year {year}...")
        
        rounds_to_process = get_unprocessed_round_replay(available_rounds, replays_parquet_filenames)
        rounds_dfs = create_replay_dataframes(rounds_to_process, drivers_json, year)
        for df, race in zip(rounds_dfs, rounds_to_process):
            if df is None:
                continue
            else:
                print(len(df), f"rows of replay data for race {race} {year}.")
                
            upload_to_aws(
                client=s3_aws_client,
                file_content=df.to_parquet(engine='fastparquet', compression='zstd', index=False),
                folder=f"{year}/replays",
                filename=f"replay_{year}_race_{race}.parquet",
                BUCKET_NAME=BUCKET_NAME
            )
                
            print(f"Finished processing replay data for race {race}.")
        
        print("-"*40)
        print(f"Updated replay data for year {year} has been uploaded to AWS S3.")
        print("-"*40)