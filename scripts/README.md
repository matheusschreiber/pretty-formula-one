# Automation script

`automation/main.py` is a batch job that keeps the S3 bucket used by Pretty Formula One in sync with the latest Formula 1 season data. It pulls session data from [FastF1](https://docs.fastf1.dev/) and, for the current year, incrementally updates:

- `drivers_<year>.json` — the season's driver roster.
- `rounds_<year>.json` — per-round results and tyre strategies.
- `telemetry_<driver>_<round>.csv` — one CSV per driver per round, containing the driver's fastest race lap telemetry.
- `replay_<year>_race_<round>.parquet` — one Parquet per race, containing the second-by-second position/state of every driver, used by the replay mode.

It is intended to be run **once after every race weekend**, either locally or from the provided Docker image. The script is idempotent: every stage skips work that is already present in the bucket, so if there is nothing new since the last run it exits without touching S3.

## Layout

The automation code lives under [automation/](automation/) and is split by concern:

| File | Responsibility |
| --- | --- |
| [main.py](automation/main.py) | Entry point. Parses CLI flags, connects to S3, and runs each stage in order. |
| [aws.py](automation/aws.py) | Lists the bucket, downloads the current `rounds`/`drivers` JSON, and uploads new artifacts. |
| [rounds.py](automation/rounds.py) | Discovers which rounds already have race results, and builds `rounds_<year>.json` entries (race + sprint points, tyre stints, retirement status). |
| [drivers.py](automation/drivers.py) | Builds `drivers_<year>.json` from the season schedule the first time it is missing. |
| [telemetry.py](automation/telemetry.py) | Extracts each driver's fastest race lap telemetry and serializes it to CSV. |
| [replay.py](automation/replay.py) | Merges laps + telemetry + minisector coloring into a single Parquet per race, used by the replay viewer. |
| [misc.py](automation/misc.py) | Shared helpers. |

## What each stage does

For a given `year` (defaults to the current year):

1. **AWS discovery** — `get_aws_files` lists the bucket once and returns the current `rounds_<year>.json`, `drivers_<year>.json`, the set of existing `telemetry_*.csv` filenames, and the set of existing `replay_*.parquet` filenames.
2. **Drivers** — if `drivers_<year>.json` is missing, iterate the season schedule and collect each driver that appears in any race result (id, team, abbreviation, name, team logo path, headshot URL), then upload the JSON.
3. **Rounds** — for every round that has race results but is not yet in `rounds_<year>.json`, fetch the race (and sprint, when applicable) results, aggregate per-driver race/sprint points and tyre stints, mark retired drivers, sort by final classification, and append the round. The updated JSON is re-uploaded.
4. **Telemetry** — for every driver, find which rounds are missing a telemetry CSV. For each missing round, load the race session, pick the driver's fastest lap, and export position, speed, RPM, gear, throttle, brake, DRS, status, and compound to CSV.
5. **Replay** — for every race that does not yet have a Parquet, load laps + telemetry for every driver, resample to one row per second per driver, compute cumulative gap-to-leader, and paint per-driver minisectors (Yellow / Green / Purple / Blue / Unknown) using a KD-tree over the qualifying fastest lap. The result is written as a zstd-compressed Parquet.

## CLI

Every stage can be skipped independently. The `--no-*` flags are inverted (they *disable* a stage), so the default run processes everything for the current year:

```bash
python automation/main.py                                       # run everything for the current year
python automation/main.py --no-telemetry --no-replay            # skip telemetry and replays
python automation/main.py --no-driver --no-round --no-telemetry # only rebuild the replay parquets
python automation/main.py --year 2024                           # rebuild missing artifacts for a past season
python automation/main.py --races 5,7 --no-driver --no-round    # re-run telemetry + replay for rounds 5 and 7 only
```

| Flag | Effect |
| --- | --- |
| `-d`, `--no-driver` | Skip drivers JSON. |
| `-r`, `--no-round` | Skip rounds JSON. |
| `-t`, `--no-telemetry` | Skip per-driver telemetry CSVs. |
| `-p`, `--no-replay` | Skip per-race replay Parquets. |
| `-y`, `--year <int>` | Target year. Defaults to the current year. |
| `-a`, `--races <csv>` | Comma-separated list of round numbers to process (e.g. `--races 5,7,12`). When set, the rounds/telemetry/replay stages act on **exactly** those rounds instead of auto-detecting what's missing, and existing artifacts for those rounds are overwritten. Has no effect on the drivers stage. |

## Requirements

- Python 3.11+.
- The packages in [requirements.txt](requirements.txt): `fastf1`, `boto3`, `python-dotenv`, `fastparquet` (`scipy` and `numpy`/`pandas` come in transitively via `fastf1` and are used by the replay stage).
- An S3 bucket with write access. The expected layout is:
    ```
    <bucket>/
        <year>/
            drivers_<year>.json
            rounds_<year>.json
            telemetries/
                race_<round>/
                    telemetry_<driver_id>_<round>.csv
                    ...
            replays/
                replay_<year>_race_<round>.parquet
                ...
    ```
- A `.env` file (loaded via `python-dotenv`) with:
    ```env
    AWS_ACCESS_KEY_ID=...
    AWS_SECRET_ACCESS_KEY=...
    AWS_REGION=us-east-1          # optional, defaults to us-east-1
    AWS_BUCKET_NAME=...
    ```

## Running locally

```bash
cd scripts
pip install -r requirements.txt
python automation/main.py
```

## Running via Docker

A minimal [Dockerfile](Dockerfile) is provided:

```bash
cd scripts
docker build -t prettyf1-automation .
docker run --rm --env-file .env prettyf1-automation
```

The container runs `python automation/main.py` with no flags, so it processes every stage.

## Output shape

### `drivers_<year>.json`

```json
[
    {
        "id": "max_verstappen_2026",
        "team": "Red Bull Racing",
        "abbreviation": "VER",
        "name": "Max Verstappen",
        "teamLogo": "/assets/icons/red-bull-racing.png",
        "photo": "https://.../4col/image.png"
    }
]
```

### `rounds_<year>.json`

```json
[
    {
        "id": 5,
        "year": 2026,
        "index": 5,
        "totalRounds": 24,
        "totalLaps": 66,
        "name": "Spanish Grand Prix",
        "nameVerbose": "Formula 1 ... Spanish Grand Prix 2026",
        "country": "Spain",
        "backgroundImage": "/assets/circuits/spain.png",
        "results": [
            {
                "driver_id": "max_verstappen_2026",
                "racePoints": 25,
                "sprintPoints": 0,
                "tyreStrat": [
                    { "compound": "SOFT",   "lapStart": 1,  "lapEnd": 18, "stint": 1 },
                    { "compound": "MEDIUM", "lapStart": 19, "lapEnd": 44, "stint": 2 }
                ],
                "retired": false
            }
        ]
    }
]
```

`results` is sorted by final classification (retired drivers are pushed to the bottom).

### `telemetry_<driver_id>_<round>.csv`

One row per telemetry sample of the driver's fastest race lap. Numeric values are rounded to one decimal to keep files small; `brake` is a boolean and `compound` is repeated on every row.

Columns: `seconds, x, y, z, rpm, speed, gear, throttle, brake, drs, status, compound`.

### `replay_<year>_race_<round>.parquet`

One row per driver per second of the race, downsampled from the raw FastF1 telemetry. Written with `fastparquet` and `zstd` compression. Columns:

| Column | Type | Notes |
| --- | --- | --- |
| `driver` | category | Driver slug (matches `drivers_<year>.json#id`). |
| `lap_number` | uint16 | |
| `x`, `y`, `z` | float32 | Track position, rounded to 2 decimals. |
| `time` | float32 | Seconds since session start. |
| `position` | uint16 | Current race position; retired drivers are pinned to the field size. |
| `compound` | category | |
| `tyre_life` | uint16 | Laps on the current set. |
| `gap_to_leader` | float32 | Computed from cumulative `gap_to_front` within each second bucket. |
| `gap_to_front` | float32 | Seconds to the car ahead, derived from `DistanceToDriverAhead` / speed. |
| `speed` | float32 | m/s. |
| `current_best_lap_time`, `last_lap_time` | float32 | Seconds. |
| `current_sector1_time`, `current_sector2_time`, `current_sector3_time` | float32 | Live sector splits for the current lap. |
| `best_sector1_time`, `best_sector2_time`, `best_sector3_time` | float32 | Personal bests up to that moment. |
| `is_in_pit` | bool | |
| `is_retired` | bool | True from the driver's final lap onward if they DNF'd. |
| `current_minisectors` | category | 24 mini-sector states across the 3 sectors, encoded as `sector1_sector2_sector3` where each character is `U` (unknown), `Y` (worse), `G` (personal best), `P` (session purple), or `B` (in pit). |

## Notebooks

The `.ipynb` files at the root of `scripts/` are exploratory — they mirror what the automation does but are useful when you want to inspect a single session, tweak a query, or prototype a new field before adding it to the pipeline. They are not part of the batch job.
