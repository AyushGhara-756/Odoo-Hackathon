import pandas as pd


def get_vehicles(status=None, vehicle_type=None, region=None):
    vehicles = pd.read_json("../data/vehicles.json")
    if status:
        vehicles = vehicles[vehicles["status"] == status]
    if vehicle_type:
        vehicles = vehicles[vehicles["type"] == vehicle_type]
    if region:
        vehicles = vehicles[vehicles["region"] == region]
    return vehicles.to_dict(orient="records")

def get_vehicle_by_id(vehicle_id):
    vehicles = pd.read_json("../data/vehicles.json")
    match = vehicles[vehicles["id"] == vehicle_id]
    return match.to_dict(orient="records")[0] if not match.empty else None


if __name__ == "__main__":
    print("No Filters:")
    print(get_vehicles())
    print("\nStatus = Available")
    print(get_vehicles(status="Available"))
    print("\nVehicle Type = Van")
    print(get_vehicles(vehicle_type="Van"))
    print("\nRegion = West")
    print(get_vehicles(region="West"))
    print("\nStatus = Available, Type = Van, Region = West")
    print(get_vehicles(
        status="Available",
        vehicle_type="Van",
        region="West"
    ))
    print("\nLookup id = 2")
    print(get_vehicle_by_id(2))
