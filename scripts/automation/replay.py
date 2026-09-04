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
    
    session_start_time = session.session_start_time.total_seconds()
    total_drivers = len(drivers_json)
    
    out_df = []
        
    for idx, driver in enumerate(drivers_json):
        driver_slug = driver["id"]
        driver_abv = driver["abbreviation"]
        driver_laps = session.laps.pick_drivers(driver_abv)
        if driver_laps.empty:
            print(f"\tNo laps found for driver {driver_slug} in race {race}. Skipping replay data for this driver.")
            continue
        
        print(f"\tProcessing driver [{idx+1:02d}/{len(drivers_json)}] {driver_slug}{'.'*(30-len(driver_slug))}", end="", flush=True)
        
        try:
            laps_telemetry = driver_laps.get_telemetry()
        except Exception:  # noqa: BLE001
            return None

        if laps_telemetry.empty:
            return None
        
        laps_meta = driver_laps[[
            'LapNumber', 'Position', 'Compound', 'TyreLife', 'PitInTime',
            'Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime', 'LapStartTime'
        ]].copy()

        for col in ['Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime']:
            laps_meta[col + '_sec'] = laps_meta[col].dt.total_seconds().fillna(0.0).astype(np.float32)

        laps_meta['best_lap'] = laps_meta['LapTime_sec'].replace(0.0, np.nan).cummin().fillna(0.0).astype(np.float32)
        laps_meta['best_s1'] = laps_meta['Sector1Time_sec'].replace(0.0, np.nan).cummin().fillna(0.0).astype(np.float32)
        laps_meta['best_s2'] = laps_meta['Sector2Time_sec'].replace(0.0, np.nan).cummin().fillna(0.0).astype(np.float32)
        laps_meta['best_s3'] = laps_meta['Sector3Time_sec'].replace(0.0, np.nan).cummin().fillna(0.0).astype(np.float32)
        laps_meta['is_in_pit'] = laps_meta['PitInTime'].notna() 
        
        laps_telemetry = laps_telemetry.sort_values('SessionTime')        
        laps_meta = laps_meta.sort_values('LapStartTime')
        
        merged = pd.merge_asof(
            laps_telemetry,
            laps_meta,
            left_on='SessionTime',
            right_on='LapStartTime',
            direction='backward'
        )
        
        time_sec_float = (merged['SessionTime'].dt.total_seconds() - session_start_time).to_numpy()
        merged['time_sec_int'] = np.floor(time_sec_float).astype(np.int32)
        
        merged = merged.drop_duplicates(subset=['time_sec_int'], keep='last').copy()
        
        time_arr = (merged['SessionTime'].dt.total_seconds() - session_start_time).to_numpy(dtype=np.float32)
        curr_lap_time = merged.groupby('LapNumber')['Time'].transform(lambda s: s - s.iloc[0])
        curr_lap_time = curr_lap_time.dt.total_seconds().to_numpy(dtype=np.float32)
        
        s1_target = merged['Sector1Time_sec'].to_numpy()
        s2_target = merged['Sector2Time_sec'].to_numpy()
        s3_target = merged['Sector3Time_sec'].to_numpy()

        # extracting the current sector timestamp (multiple lap telemetry data points) 
        # and clipping to not exceed the final sector times (single lap data point)
        s1 = np.clip(curr_lap_time, 0, s1_target)
        s2 = np.clip(curr_lap_time - s1, 0, s2_target)
        s3 = np.clip(curr_lap_time - s1 - s2, 0, s3_target)

        speed = merged['Speed'].fillna(0.0).to_numpy(dtype=np.float32)
        speed_ms = speed * (1000.0 / 3600.0)
        
        dist_ahead = merged['DistanceToDriverAhead'].fillna(-1.0).to_numpy(dtype=np.float32)
        interval = np.where(speed_ms > 0, dist_ahead / np.where(speed_ms > 0, speed_ms, 1.0), -1.0)

        lap_numbers = merged['LapNumber'].to_numpy(dtype=np.uint16)
        lap_times = merged['LapTime_sec'].to_numpy(dtype=np.float32)
        last_lap_times = np.where(lap_numbers > 1, lap_times, 0.0)
        
        driver_result = session.results.loc[session.results['Abbreviation'] == driver_abv]
        is_dnf = not driver_result.empty and driver_result['Status'].iloc[0] not in ['Finished', '+1 Lap', '+2 Laps']
        final_lap = driver_laps['LapNumber'].max()
        is_retired = (lap_numbers == final_lap) if is_dnf else False
        
        pre = pd.DataFrame({
            "driver": driver_slug,
            "driver_abv": driver_abv,
            "lap_number": lap_numbers,
            "x": merged['X'].round(2).to_numpy(dtype=np.float32),
            "y": merged['Y'].round(2).to_numpy(dtype=np.float32),
            "z": merged['Z'].round(2).to_numpy(dtype=np.float32),
            "time": np.round(time_arr, 3),
            "time_sec_int": merged['time_sec_int'].to_numpy(),
            "position": merged['Position'].fillna(total_drivers).to_numpy(dtype=np.uint16),
            "compound": merged['Compound'].astype(str),
            "tyre_life": merged['TyreLife'].fillna(0).to_numpy(dtype=np.uint16),
            "gap_to_leader": np.float32(0.0),
            "gap_to_front": np.round(interval, 3).astype(np.float32),
            "speed": np.round(speed_ms, 3).astype(np.float32),
            "current_best_lap_time": np.round(merged['best_lap'], 3),
            "last_lap_time": np.round(last_lap_times, 3),
            "current_sector1_time": np.round(s1, 3),
            "current_sector2_time": np.round(s2, 3),
            "current_sector3_time": np.round(s3, 3),
            "best_sector1_time": np.round(merged['best_s1'], 3),
            "best_sector2_time": np.round(merged['best_s2'], 3),
            "best_sector3_time": np.round(merged['best_s3'], 3),
            "is_in_pit": merged['is_in_pit'].to_numpy(dtype=bool),
            "is_retired": is_retired,
            "current_minisectors": ""
        })
        
        out_df.append(pre)
        
        print("[done]")
        
    out_df = pd.concat(out_df, ignore_index=True)
               
    print("Adding gap intervals and minisectors.....", end="", flush=True)
    
    # calculating gap_to_leader based on aggregated gap_to_front
    out_df = out_df.sort_values(["time_sec_int", "position"]).reset_index(drop=True)
    out_df["_valid_intervals"] = np.where(
        (out_df["position"] > 1) & (out_df["gap_to_front"] > 0),
        out_df["gap_to_front"],
        0.0
    )
    out_df["gap_to_leader"] = (
        out_df.groupby("time_sec_int")["_valid_intervals"]
        .cumsum()
        .round(3)
        .astype(np.float32)
    )
    out_df.drop(columns=["_valid_intervals"], inplace=True)
        
    # calculating minisectors
    track_minisectors = TrackMinisectors(race, year)
    drivers_minisectors = initialize_drivers_minisectors(drivers_json, track_minisectors)
    out_df["current_minisectors"] = out_df.apply(lambda row: get_current_minisectors(
        drivers_minisectors, 
        row['time'],         # time 
        row['x'],            # x
        row['y'],            # y
        track_minisectors,
        row['driver'],       # driver_slug
        row['is_in_pit'],    # is_in_pit
    ), axis=1)
            
    print("[done]", flush=True)
    
    return out_df
        
