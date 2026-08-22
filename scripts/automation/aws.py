import json
from datetime import datetime

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005


def get_aws_files(s3_aws_client, year, BUCKET_NAME):
    print(f"Fetching files from AWS S3 for year {year}...")
    telemetries_csvs_filenames = []
    replays_parquet_filenames = []
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
            elif "replay_" in key and key.endswith('.parquet'):
                replay_key = key.split('/')[-1]
                replays_parquet_filenames.append(replay_key)
    print(f"Fetched {len(rounds_json)} rounds, {len(drivers_json)} drivers, {len(telemetries_csvs_filenames)} telemetry files, and {len(replays_parquet_filenames)} replay files from AWS S3 for year {year}.")
    return rounds_json, drivers_json, telemetries_csvs_filenames, replays_parquet_filenames


def upload_to_aws(client, file_content, folder, filename, BUCKET_NAME):
    data_type = {
        "json": "application/json",
        "csv": "text/csv",
        "parquet": "application/octet-stream"
    }
    client.put_object(
        Bucket=BUCKET_NAME, 
        Key=f"{folder}/{filename}", 
        Body=file_content,
        ContentType=data_type[filename.split('.')[-1]],
    )
    print(f"Uploaded {filename} to AWS S3 bucket {BUCKET_NAME}.")