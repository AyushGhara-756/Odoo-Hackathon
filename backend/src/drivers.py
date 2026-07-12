from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def drivers(status=None, license_category=None, region=None):

    drivers_data = pd.read_json(DATA_DIR / "drivers.json")

    if status:
        drivers_data = drivers_data[drivers_data["status"] == status]

    if license_category:
        drivers_data = drivers_data[drivers_data["licenseCategory"] == license_category]

    if region:
        drivers_data = drivers_data[drivers_data["region"] == region]

    return drivers_data.to_dict(orient="records")


if __name__ == "__main__":

    print(drivers())

    print("\nAvailable Drivers")
    print(drivers(status="Available"))

    print("\nLMV Drivers")
    print(drivers(license_category="LMV"))

    print("\nWest Region")
    print(drivers(region="West"))