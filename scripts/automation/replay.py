from datetime import datetime

import fastf1
import pandas as pd

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005

COLUMNS = [
    "driver", "lap_number", "x", "y", "z", "time", "position", "compound", "tyre_life",
    "gap_to_leader", "gap_to_front", "speed", "current_best_lap_time", "last_lap_time",
    "current_sector1_time", "current_sector2_time", "current_sector3_time",
    "best_sector1_time", "best_sector2_time", "best_sector3_time",
    "is_in_pit", "is_retired",
]

DTYPES = {
    "driver": "category",
    "lap_number": "uint16",
    "x": "float32",
    "y": "float32",
    "z": "float32",
    "time": "float32",
    "position": "uint16",
    "compound": "category",
    "tyre_life": "uint16",
    "gap_to_leader": "float32",
    "gap_to_front": "float32",
    "speed": "float32",
    "current_best_lap_time": "float32",
    "last_lap_time": "float32",
    "current_sector1_time": "float32",
    "current_sector2_time": "float32",
    "current_sector3_time": "float32",
    "best_sector1_time": "float32",
    "best_sector2_time": "float32",
    "best_sector3_time": "float32",
    "is_in_pit": "bool",
    "is_retired": "bool",
}

def get_unprocessed_round_replay(available_rounds, replays_parquet_filenames):
    processed_rounds = {int(f.split('_race_')[1].split('_lap_')[0]) for f in replays_parquet_filenames}
    unprocessed_rounds = [r for r in available_rounds if r not in processed_rounds]
    return unprocessed_rounds

def create_replay_dataframes(rounds_to_process, drivers_json, year):
    
    rounds_dfs = []
    
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
            
            print(f"\tProcessing driver [{idx+1}/{len(drivers_json)}] {driver_slug}{'.'*(30-len(driver_slug))}", end="", flush=True)
            
            best_sectors = [float('inf'), float('inf'), float('inf')]
            best_lap_time = float('inf')
            session_start_time = session.session_start_time.total_seconds()
            
            for driver_lap in driver_laps.iterlaps():            
                lap_telemetry = driver_lap[1].get_telemetry()
                lap_number = int(driver_lap[1]['LapNumber'])
                
                sector1_time = driver_lap[1]['Sector1Time'].total_seconds()
                sector2_time = driver_lap[1]['Sector2Time'].total_seconds()
                sector3_time = driver_lap[1]['Sector3Time'].total_seconds()
                
                lap_time = driver_lap[1]['LapTime'].total_seconds()
                
                for _, row in lap_telemetry.iterrows():  
                    
                    curr_time_lap = row['Time'].total_seconds()
                    
                    s1 = min(curr_time_lap, sector1_time) 
                    s2 = min(curr_time_lap - s1, sector2_time)
                    s3 = min(curr_time_lap - s1 - s2, sector3_time)
                    
                    position = int(driver_lap[1]['Position']) if not pd.isna(driver_lap[1]['Position']) else len(drivers_json)
                    time = row['SessionTime'].total_seconds() - session_start_time
                        
                    speed_ms = row['Speed'] * 1000 / 3600 if not pd.isna(row['Speed']) else 0.0
                    interval = row['DistanceToDriverAhead'] / speed_ms if speed_ms > 0 else -1
                    
                    lap_replays[lap_number - 1].append([
                        driver_slug,                # 0 driver
                        lap_number,                 # 1 lap_number
                        round(row['X'], 2),         # 2 x
                        round(row['Y'], 2),         # 3 y
                        round(row['Z'], 2),         # 4 z
                        round(time, 3),             # 5 time
                        position,                   # 6 position
                        driver_lap[1]['Compound'],  # 7 compound
                        int(driver_lap[1]['TyreLife']) if not pd.isna(driver_lap[1]['TyreLife']) else 0,  # 8 tyre_life
                        0,                          # 9 gap_to_leader (calculated later)
                        round(interval, 3),         # 10 gap_to_front
                        round(speed_ms, 3),         # 11 speed
                        round(best_lap_time, 3) if best_lap_time != float('inf') else 0.0,  # 12 current_best_lap_time
                        round(lap_time, 3) if lap_number > 1 else 0.0, # 13 last_lap_time
                        round(s1, 3) if s1 > 0 else 0.0,      # 14 current_sector1_time
                        round(s2, 3) if s2 > 0 else 0.0,      # 15 current_sector2_time
                        round(s3, 3) if s3 > 0 else 0.0,      # 16 current_sector3_time
                        round(best_sectors[0], 3) if best_sectors[0] != float('inf') else 0.0,    # best_sector1_time
                        round(best_sectors[1], 3) if best_sectors[1] != float('inf') else 0.0,    # best_sector2_time
                        round(best_sectors[2], 3) if best_sectors[2] != float('inf') else 0.0,    # best_sector3_time
                        driver_lap[1]["PitInTime"] is not pd.NaT, # is_in_pit
                        False,                      # TODO: # is_retired
                    ])
                    
                best_sectors = [
                    min(best_sectors[0], sector1_time),
                    min(best_sectors[1], sector2_time),
                    min(best_sectors[2], sector3_time),
                ]
                
                best_lap_time = min(best_lap_time, lap_time)
            
            print("[done]")
        
        print("Sorting and adding gap intervals.....", end="", flush=True)
            
        all_rows = []
        for lap_replay in lap_replays:
            lap_replay.sort(key=lambda x: x[5]) # based on time
            all_rows.extend(lap_replay)
        
        # calculating gap_to_leader based on aggregated gap_to_front
        max_time = max(row[5] for row in all_rows)
        matrix_intervals = [[0] * len(drivers_json) for _ in range(int(max_time)+1)]
        for row in all_rows:
            interval = row[10]
            time_truncated = int(row[5])
            position = row[6] - 1
            matrix_intervals[time_truncated][position] = interval
        for j in range(len(matrix_intervals)):
            aux = []
            for i in matrix_intervals[j]:
                if not aux:
                    aux.append(0)
                else:
                    aux.append(round(aux[-1] + i, 3))
            matrix_intervals[j] = aux[:]
        for j in range(len(all_rows)):
            time_truncated = int(all_rows[j][5])
            position = all_rows[j][6] - 1
            all_rows[j][9] = matrix_intervals[time_truncated][position]
        
        df = pd.DataFrame(all_rows, columns=COLUMNS).astype(DTYPES)
        
        # applying a rolling average on gap_to_front because of the high frequency fluctuations
        df = df.sort_values(["driver", "time"]).reset_index(drop=True)
        df["stint"] = df.groupby("driver", observed=False)["is_in_pit"].transform(lambda x: (x != x.shift()).cumsum())
        def smooth_stint(group):
            t_idx = pd.to_timedelta(group["time"], unit="s")
            s = pd.Series(group["gap_to_front"].values, index=t_idx)
            group["gap_to_front"] = s.rolling("120s", min_periods=1).mean().round(3).values
            return group
        df = df.groupby(["driver", "stint"], group_keys=False, observed=False).apply(smooth_stint, include_groups=True)
        df = df.sort_values("time").drop(columns=["stint"]).reset_index(drop=True)
        # all_rows = df[COLUMNS].values.tolist()
    
        print("[done]", flush=True)
        
        rounds_dfs.append(df)
    
    return rounds_dfs
        
