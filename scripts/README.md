# Automation script

`automation.py` is a batch job that keeps the S3 bucket used by Pretty Formula One in sync with the latest Formula 1 season data. It pulls session data from [FastF1](https://docs.fastf1.dev/), incrementally updates `rounds_<year>.json`, and generates one telemetry CSV per driver per round.

It is intended to be run **once after every race weekend**, either locally or from the provided Docker image.

## What it does (high level)

For a given `year`:

1. Queries FastF1 for the season schedule and figures out which rounds already have race results available.
2. Downloads the current `rounds_<year>.json`, `drivers_<year>.json`, and the list of existing `telemetry_*.csv` files from S3.
3. For every round that is not yet present in `rounds_<year>.json`, fetches the race (and sprint, when applicable) results, aggregates per-driver race/sprint points and tyre stints, and appends the round to the JSON.
4. Uploads the updated `rounds_<year>.json` back to S3.
5. For every driver, finds which rounds are missing a telemetry CSV and, for each missing round, extracts the driver's fastest lap telemetry (position, speed, RPM, gear, throttle, brake, DRS, compound, ...) and uploads it as `telemetry_<driver_id>_<round>.csv`.

The script is idempotent: if there is nothing new since the last run it exits without touching the bucket.

## Requirements

- Python 3.11+.
- The packages in [requirements.txt](requirements.txt): `fastf1`, `boto3`, `python-dotenv`.
- An S3 bucket with write access. The bucket layout the script expects is:
    ```
    <bucket>/
        <year>/
            rounds_<year>.json
            drivers_<year>.json
            telemetry_<driver_id>_<round>.csv
            ...
    ```
- A `.env` file (loaded via `python-dotenv`) with:
    ```env
    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    AWS_REGION=us-east-1          # optional, defaults to us-east-1
    AWS_BUCKET_NAME=...
    ```

## Output shape

Each entry appended to `rounds_<year>.json` looks like:

```json
{
    "id": 5,
    "year": 2026,
    "index": 5,
    "totalRounds": 24,
    "name": "Spanish Grand Prix",
    "nameVerbose": "Formula 1 ... Spanish Grand Prix 2026",
    "country": "Spain",
    "backgroundImage": "/assets/circuits/spain.png",
    "results": [
        {
            "driver_id": "max_verstappen_2026",
            "racePoints": 25,
            "sprintPoints": 0,
            "tyre_strat": [
                { "compound": "SOFT",   "lapStart": 1,  "lapEnd": 18, "stint": 1 },
                { "compound": "MEDIUM", "lapStart": 19, "lapEnd": 44, "stint": 2 }
            ]
        }
    ]
}
```

Each telemetry CSV row is one sample of the driver's fastest lap. Values are rounded to one decimal to keep files small; `brake` is a boolean and `compound` is repeated on every row.
