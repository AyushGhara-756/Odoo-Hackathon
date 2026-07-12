import json
import os
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TRIPS_FILE = DATA_DIR / "trips.json"
VEHICLES_FILE = DATA_DIR / "vehicles.json"

VALID_STATUSES = {"Draft", "Dispatched", "In Transit", "Completed", "Cancelled"}


def trips(status=None, region=None):
    if not os.path.exists(TRIPS_FILE):
        return []
    trips_data = pd.read_json(TRIPS_FILE)
    if trips_data.empty:
        return []
    if status:
        trips_data = trips_data[trips_data["status"] == status]
    if region:
        trips_data = trips_data[trips_data["region"] == region]
    records = trips_data.to_dict(orient="records")
    for rec in records:
        for k, v in rec.items():
            if isinstance(v, float) and pd.isna(v):
                rec[k] = None
            elif isinstance(v, float) and v == int(v):
                rec[k] = int(v)
    return records


def create_trip(
    source,
    destination,
    vehicle,
    driver,
    cargo_weight,
    planned_distance,
    region,
):
    with open(TRIPS_FILE, "r") as file:
        trips = json.load(file)
    with open(VEHICLES_FILE, "r") as file:
        vehicles = json.load(file)

    vehicle_match = next((v for v in vehicles if v["name"] == vehicle), None)
    if vehicle_match is None:
        return {
            "success": False,
            "message": "Vehicle not found"
        }

    # figure out next trip number from existing ids so deletions don't cause collisions
    max_num = 0
    for t in trips:
        if t["tripId"].startswith("TR") and t["tripId"][2:].isdigit():
            max_num = max(max_num, int(t["tripId"][2:]))

    trip = {
        "tripId": f"TR{max_num + 1:03}",
        "source": source,
        "destination": destination,
        "vehicle": vehicle,
        "driver": driver,
        "cargoWeight": cargo_weight,
        "plannedDistance": planned_distance,
        "actualDistance": None,
        "fuelConsumed": None,
        "startOdometer": None,
        "endOdometer": None,
        "revenue": 0,
        "status": "Draft",
        "eta": "Awaiting Dispatch",
        "region": region
    }
    trips.append(trip)
    with open(TRIPS_FILE, "w") as file:
        json.dump(trips, file, indent=4)
    return {
        "success": True,
        "message": "Trip created successfully",
        "trip": trip
    }


def dispatch_trip(trip_id):
    with open(TRIPS_FILE, "r") as file:
        trips = json.load(file)
    with open(VEHICLES_FILE, "r") as file:
        vehicles = json.load(file)
    for trip in trips:
        if trip["tripId"] != trip_id:
            continue
        if trip["status"] != "Draft":
            return {
                "success": False,
                "message": f"Cannot dispatch a trip with status '{trip['status']}'"
            }
        vehicle = next(
            (v for v in vehicles if v["name"] == trip["vehicle"]),
            None
        )
        if vehicle is None:
            return {
                "success": False,
                "message": "Vehicle not found"
            }
        capacity = vehicle["maxLoadCapacity"]
        cargo = trip["cargoWeight"]
        if cargo > capacity:
            return {
                "success": False,
                "message": "Dispatch blocked",
                "vehicleCapacity": capacity,
                "cargoWeight": cargo,
                "exceededBy": cargo - capacity
            }
        trip["status"] = "Dispatched"
        with open(TRIPS_FILE, "w") as file:
            json.dump(trips, file, indent=4)
        return {
            "success": True,
            "message": "Trip dispatched successfully",
            "trip": trip
        }
    return {
        "success": False,
        "message": "Trip not found"
    }


def update_trip_status(trip_id, status):
    if status not in VALID_STATUSES:
        return {
            "success": False,
            "message": f"Invalid status '{status}'"
        }
    with open(TRIPS_FILE, "r") as file:
        trips = json.load(file)
    for trip in trips:
        if trip["tripId"] == trip_id:
            trip["status"] = status
            with open(TRIPS_FILE, "w") as file:
                json.dump(trips, file, indent=4)
            return {
                "success": True,
                "message": "Trip status updated",
                "trip": trip
            }
    return {
        "success": False,
        "message": "Trip not found"
    }


if __name__ == "__main__":
    print("All Trips")
    print(trips())

    print("\nCreate Trip")
    created = create_trip(
        source="Delhi",
        destination="Jaipur",
        vehicle="VAN-05",
        driver="Alex",
        cargo_weight=700,
        planned_distance=280,
        region="North"
    )
    print(created)

    if created["success"]:
        trip_id = created["trip"]["tripId"]

        print("\nDispatch Trip")
        print(dispatch_trip(trip_id))

        print("\nComplete Trip")
        print(update_trip_status(trip_id, "Completed"))