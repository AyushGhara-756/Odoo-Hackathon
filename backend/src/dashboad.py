import pandas as pd

def dashboard(status=None, vehicle_type=None, region=None):

    vehicles = pd.read_json("data/vehicles.json")
    drivers = pd.read_json("data/drivers.json")
    trips = pd.read_json("data/trips.json")

    # Vehicle filters
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

    return {
        "activeVehicles": len(active_vehicles),
        "availableVehicles": len(available_vehicles),
        "vehiclesInMaintenance": len(maintenance),
        "activeTrips": len(active_trips),
        "pendingTrips": len(pending_trips),
        "driversOnDuty": len(drivers_on_duty),
        "fleetUtilization": round(
            len(active_vehicles) / len(vehicles) * 100, 2
        ) if len(vehicles) else 0
    }