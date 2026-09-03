from datetime import datetime

import fastf1
import numpy as np
import pandas as pd
from scipy.spatial import KDTree

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005

COLUMNS = [
    "driver", "lap_number", "x", "y", "z", "time", "position", "compound", "tyre_life",
    "gap_to_leader", "gap_to_front", "speed", "current_best_lap_time", "last_lap_time",
    "current_sector1_time", "current_sector2_time", "current_sector3_time",
    "best_sector1_time", "best_sector2_time", "best_sector3_time", 
    "is_in_pit", "is_retired", "current_minisectors"
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
    "current_minisectors": "category"
}

def get_unprocessed_round_replay(available_rounds, replays_parquet_filenames):
    return [11] # TODO: remove this line after testing
    processed_rounds = {int(f.split('_race_')[1].split('.')[0]) for f in replays_parquet_filenames}
    unprocessed_rounds = [r for r in available_rounds if r not in processed_rounds]
    return unprocessed_rounds


class TrackMinisectors:
    def __init__(self, race_id, year):
        session = fastf1.get_session(year, race_id, 'Q')
        session.load()
        fastest_lap = session.laps.pick_fastest()
        pos_data = fastest_lap.get_pos_data().copy()
    
        s1_end = fastest_lap['Sector1SessionTime']
        s2_end = fastest_lap['Sector2SessionTime']
    
        conditions = [
            pos_data['SessionTime'] <= s1_end,
            (pos_data['SessionTime'] > s1_end) & (pos_data['SessionTime'] <= s2_end),
            pos_data['SessionTime'] > s2_end
        ]
        choices = [1, 2, 3]
    
        pos_data['Sector'] = np.select(conditions, choices, default=3)
    
        track_x = pos_data['X']
        track_y = pos_data['Y']
        track_s = pos_data['Sector']
    
        perimeter = 0.0
        for i in range(len(track_x) - 1):
            dx = track_x[i + 1] - track_x[i]
            dy = track_y[i + 1] - track_y[i]
            perimeter += (dx**2 + dy**2)**0.5
    
        dx = np.diff(track_x)
        dy = np.diff(track_y)
        segment_lengths = np.hypot(dx, dy)
        cum_distance = np.insert(np.cumsum(segment_lengths), 0, 0.0)
        total_length = cum_distance[-1]
        # minisectors amount (between 6 and 8 per sector, so 24 is a good number)
        MS_AMOUNT = 24 
        self.track_ms = np.minimum((cum_distance / total_length * MS_AMOUNT).astype(int), MS_AMOUNT - 1)
        track_coords = np.column_stack((track_x, track_y))
        
        kdtree = KDTree(track_coords)
        best_times = [float('inf')] * len(track_x)
        _, start_indices = np.unique(self.track_ms, return_index=True)
        end_indices = np.append(start_indices[1:], len(self.track_ms))
        mid_indices = (start_indices + end_indices) // 2
        self.track_minisectors_points = []
        for i in mid_indices:
            self.track_minisectors_points.append([
                track_coords[i][0],
                track_coords[i][1],
                track_s[i],
                self.track_ms[i],
                best_times[i]
            ])
        self.kdtree = kdtree
    
    def get_minisector_by_position(self, driver_x, driver_y):
        query_pts = np.atleast_2d(np.column_stack((driver_x, driver_y)) if np.ndim(driver_x) > 0 else [driver_x, driver_y])
        _, indices = self.kdtree.query(query_pts)
        
        result = self.track_ms[indices]
        return result[0] if np.ndim(driver_x) == 0 else result
    
    def get_minisector_best_time_by_index(self, minisector_idx):
        return self.track_minisectors_points[minisector_idx][4]
    
    def update_minisector_best_time(self, minisector_idx, best_time):
        self.track_minisectors_points[minisector_idx] = (
            self.track_minisectors_points[minisector_idx][0],
            self.track_minisectors_points[minisector_idx][1],
            self.track_minisectors_points[minisector_idx][2],
            self.track_minisectors_points[minisector_idx][3],
            best_time
        )
        
    def get_track_minisectors_points(self):
        return self.track_minisectors_points
        
    
def initialize_drivers_minisectors(drivers_json, track_minisectors):
    drivers_minisectors = {}
    for driver in drivers_json:
        driver_slug = driver["id"]
        drivers_minisectors[driver_slug] = []
        for ms in track_minisectors.track_minisectors_points:
            sector_idx = ms[2]
            
            # driver minisector point format: 
            #   [sector_idx, status, session_time, best_time]
            
            minisector_points = [sector_idx, "U", float('inf'), float('inf')]
            drivers_minisectors[driver_slug].append(minisector_points)
    
    return drivers_minisectors
    


def get_current_minisectors(drivers_minisectors, session_time, x, y, track_minisectors, driver_slug, is_in_pit):
    
    ms_idx = track_minisectors.get_minisector_by_position(x, y)
    
    if ms_idx == 0:
        for i in range(len(drivers_minisectors[driver_slug])):
            # resetting all minisectors to unknown at the start of a new lap
            drivers_minisectors[driver_slug][i][1] = "U" # Unknown 
            
    driver_ms_times = [m[2] for m in drivers_minisectors[driver_slug] if m[2] != float('inf')]
    if len(driver_ms_times) == 0:
        last_computed_minisector_idx = 0
    else:
        last_computed_minisector_idx = max(range(len(driver_ms_times)), key=lambda i: driver_ms_times[i])
    
    drivers_minisectors[driver_slug][ms_idx][2] = session_time
    
    if ms_idx != last_computed_minisector_idx:
    
        driver_prev_prev_ms_session_time = drivers_minisectors[driver_slug][ms_idx-2][2]
        driver_prev_ms_session_time = drivers_minisectors[driver_slug][ms_idx-1][2]
        driver_prev_ms_time = driver_prev_ms_session_time - driver_prev_prev_ms_session_time
        
        if is_in_pit:
            drivers_minisectors[driver_slug][ms_idx-1][1] = "B"  # Blue (in pit)
        else:
            driver_best_prev_ms_time = drivers_minisectors[driver_slug][ms_idx-1][3]
            if driver_prev_ms_time >= driver_best_prev_ms_time:
                drivers_minisectors[driver_slug][ms_idx-1][1] = "Y"  # Yellow (worse time)
            elif driver_prev_ms_time < driver_best_prev_ms_time:
                drivers_minisectors[driver_slug][ms_idx-1][1] = "G"  # Green (own best time)
                drivers_minisectors[driver_slug][ms_idx-1][3] = driver_prev_ms_time
                
                all_drivers_ms_best_time = track_minisectors.get_minisector_best_time_by_index(ms_idx-1)
                if driver_prev_ms_time < all_drivers_ms_best_time:
                    drivers_minisectors[driver_slug][ms_idx-1][1] = "P"  # Purple (session best)
                    track_minisectors.update_minisector_best_time(ms_idx-1, driver_prev_ms_time)
            
    out_str = ["","",""]
    for ms in drivers_minisectors[driver_slug]:
        out_str[ms[0]-1] += ms[1]
    
    # Y - Yellow, G - Green, P - Purple, B - Blue, U - Unknown
    return "_".join(out_str)
   
    
def create_replay_dataframe(race, drivers_json, year):
    
    print(f"Processing race {race}...")
    
    session = fastf1.get_session(year, race, "R")
    session.load(laps=True, telemetry=True, weather=False)
    
    max_session_time = int(session.laps['Time'].max().total_seconds())
    time_reference_range = range(max_session_time)
    
    drivers_dict = {d["abbreviation"]: [] for d in drivers_json}
    lap_replays = {k: drivers_dict.copy() for k in time_reference_range}
        
    for idx, driver in enumerate(drivers_json):
        driver_slug = driver["id"]
        driver_abv = driver["abbreviation"]
        driver_laps = session.laps.pick_drivers(driver_abv)
        if driver_laps.empty:
            print(f"\tNo laps found for driver {driver_slug} in race {race}. Skipping replay data for this driver.")
            continue
        
        retired_lap = False
        if len(driver_laps) < session.total_laps + 2:
            retired_lap = driver_laps['LapNumber'].max() + 1
        
        print(f"\tProcessing driver [{idx+1}/{len(drivers_json)}] {driver_slug}{'.'*(30-len(driver_slug))}", end="", flush=True)
        
        best_sectors = [float('inf'), float('inf'), float('inf')]
        best_lap_time = float('inf')
        session_start_time = session.session_start_time.total_seconds()
        
        try:
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
                    distance_ahead = row['DistanceToDriverAhead'] if not pd.isna(row['DistanceToDriverAhead']) else -1
                    interval = distance_ahead / speed_ms if speed_ms > 0 else -1
                    
                    tyre_life = int(driver_lap[1]['TyreLife']) if not pd.isna(driver_lap[1]['TyreLife']) else 0
                    is_in_pit = driver_lap[1]["PitInTime"] is not pd.NaT
                    is_retired = lap_number >= retired_lap if retired_lap else False
                    
                    lap_replays[int(time)][driver_abv] = [
                        driver_slug,                # 0 driver
                        lap_number,                 # 1 lap_number
                        round(row['X'], 2),         # 2 x
                        round(row['Y'], 2),         # 3 y
                        round(row['Z'], 2),         # 4 z
                        round(time, 3),             # 5 time
                        position,                   # 6 position
                        driver_lap[1]['Compound'],  # 7 compound
                        tyre_life,                  # 8 tyre_life
                        0,                          # 9 gap_to_leader (calculated later)
                        round(interval, 3),         # 10 gap_to_front
                        round(speed_ms, 3),         # 11 speed
                        round(best_lap_time, 3) if best_lap_time != float('inf') else 0.0,     # 12 current_best_lap_time
                        round(lap_time, 3) if lap_number > 1 else 0.0,                         # 13 last_lap_time
                        round(s1, 3) if s1 > 0 else 0.0,                                       # 14 current_sector1_time
                        round(s2, 3) if s2 > 0 else 0.0,                                       # 15 current_sector2_time
                        round(s3, 3) if s3 > 0 else 0.0,                                       # 16 current_sector3_time
                        round(best_sectors[0], 3) if best_sectors[0] != float('inf') else 0.0, # 17 best_sector1_time
                        round(best_sectors[1], 3) if best_sectors[1] != float('inf') else 0.0, # 18 best_sector2_time
                        round(best_sectors[2], 3) if best_sectors[2] != float('inf') else 0.0, # 19 best_sector3_time
                        is_in_pit,                  # 20 is_in_pit
                        is_retired,                 # 21 is_retired
                        "",                         # 22 current_minisectors (calculated later)
                    ]
                    
                best_sectors = [
                    min(best_sectors[0], sector1_time),
                    min(best_sectors[1], sector2_time),
                    min(best_sectors[2], sector3_time),
                ]
                
                best_lap_time = min(best_lap_time, lap_time)
            
        except Exception as e:  # noqa: BLE001
            print(f"\n\tError processing driver {driver_slug} in race {race}: {e}. Skipping replay data for this driver.")
        
        print("[done]")
               
    print("Adding gap intervals and minisectors.....", end="", flush=True)
    
    # calculating gap_to_leader based on aggregated gap_to_front
    for drivers in lap_replays.values():
        acc_interval = 0
        for pos in range(2, len(drivers_json)):
            driver_row = [d for d in drivers.values() if len(d) > 0 and d[6] == pos]
            if len(driver_row) == 0: continue
            driver_row = driver_row[0]
            acc_interval += driver_row[10]
            driver_row[9] = round(acc_interval, 3)
        
    # calculating minisectors
    track_minisectors = TrackMinisectors(race, year)
    drivers_minisectors = initialize_drivers_minisectors(drivers_json, track_minisectors)
    for drivers in lap_replays.values():
        for driver in drivers.values():
            if len(driver) == 0: continue
            current_minisectors_string = get_current_minisectors(
                drivers_minisectors, 
                driver[5],         # time 
                driver[2],         # x
                driver[3],         # y
                track_minisectors, 
                driver[0],         # driver_slug
                driver[20],        # is_in_pit
            )
            driver[22] = current_minisectors_string
            
    all_rows = [driver for drivers in lap_replays.values() for driver in drivers.values()]
    all_rows = [row for row in all_rows if len(row) > 0]
    df = pd.DataFrame(all_rows, columns=COLUMNS).astype(DTYPES)
    df = df.sort_values("time").reset_index(drop=True)
    
    print("[done]", flush=True)
    
    return df
        
