from datetime import datetime

import fastf1

_orig_print = print
print = lambda *args, **kwargs: _orig_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)  # noqa: DTZ005


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