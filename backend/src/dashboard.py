from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def dashboard(status=None, vehicle_type=None, region=None):

    vehicles = pd.read_json(DATA_DIR / "vehicles.json")
    drivers = pd.read_json(DATA_DIR / "drivers.json")
    trips = pd.read_json(DATA_DIR / "trips.json")

    if status:
        vehicles = vehicles[vehicles["status"] == status]

    if vehicle_type:
        vehicles = vehicles[vehicles["type"] == vehicle_type]

    if region:
        vehicles = vehicles[vehicles["region"] == region]
        drivers = drivers[drivers["region"] == region]
        trips = trips[trips["region"] == region]

    active_vehicles = vehicles[vehicles["status"] == "On Trip"]
    available_vehicles = vehicles[vehicles["status"] == "Available"]
    maintenance = vehicles[vehicles["status"] == "In Shop"]

    active_trips = trips[trips["status"] == "Dispatched"]
    pending_trips = trips[trips["status"] == "Draft"]

    drivers_on_duty = drivers[
        drivers["status"].isin(["Available", "On Trip"])
    ]

    recent_trips = trips[[
        "tripId",
        "vehicle",
        "driver",
        "status",
        "eta"
    ]].tail(5).to_dict(orient="records")

    return {
        "activeVehicles": len(active_vehicles),
        "availableVehicles": len(available_vehicles),
        "vehiclesInMaintenance": len(maintenance),
        "activeTrips": len(active_trips),
        "pendingTrips": len(pending_trips),
        "driversOnDuty": len(drivers_on_duty),
        "fleetUtilization": round(
            len(active_vehicles) / len(vehicles) * 100,
            2
        ) if len(vehicles) else 0,

        "recentTrips": recent_trips
    }

if __name__ == "__main__":

    print("No Filters:")
    print(dashboard())

    print("\nStatus = Available")
    print(dashboard(status="Available"))

    print("\nVehicle Type = Van")
    print(dashboard(vehicle_type="Van"))

    print("\nRegion = West")
    print(dashboard(region="West"))

    print("\nStatus = Available, Type = Van, Region = West")
    print(dashboard(
        status="Available",
        vehicle_type="Van",
        region="West"
    ))