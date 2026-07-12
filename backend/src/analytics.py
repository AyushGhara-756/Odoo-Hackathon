from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

VEHICLES_FILE = DATA_DIR / "vehicles.json"
TRIPS_FILE = DATA_DIR / "trips.json"


def analytics():

    if not VEHICLES_FILE.exists() or not TRIPS_FILE.exists():
        return {}

    vehicles = pd.read_json(VEHICLES_FILE)
    trips = pd.read_json(TRIPS_FILE)

    if vehicles.empty or trips.empty:
        return {}

    completed = trips[trips["status"] == "Completed"]

    total_distance = completed["actualDistance"].fillna(0).sum()
    total_fuel = completed["fuelConsumed"].fillna(0).sum()

    fuel_efficiency = round(
        total_distance / total_fuel,
        2
    ) if total_fuel else 0

    fleet_utilization = round(
        len(vehicles[vehicles["status"] == "On Trip"])
        / len(vehicles) * 100,
        2
    ) if len(vehicles) else 0

    # Using plannedDistance because most demo trips have
    # actualDistance = null
    operational_cost = round(
        completed["fuelConsumed"].fillna(0).sum() * 90 +
        completed["plannedDistance"].fillna(0).sum() * 5,
        2
    )

    total_revenue = completed["revenue"].fillna(0).sum()
    acquisition_cost = vehicles["acquisitionCost"].sum()

    vehicle_roi = round(
        (total_revenue - operational_cost)
        / acquisition_cost * 100,
        2
    ) if acquisition_cost else 0

    vehicle_costs = []

    for vehicle in vehicles.itertuples():

        vehicle_trips = completed[
            completed["vehicle"] == vehicle.name
        ]

        cost = (
            vehicle_trips["fuelConsumed"].fillna(0).sum() * 90 +
            vehicle_trips["plannedDistance"].fillna(0).sum() * 5
        )

        vehicle_costs.append({
            "vehicle": vehicle.name,
            "cost": round(cost, 2)
        })

    vehicle_costs.sort(
        key=lambda x: x["cost"],
        reverse=True
    )

    # Placeholder until trips have a completedAt/date field
    monthly_revenue = (
        completed["revenue"]
        .fillna(0)
        .tolist()
    )

    return {
        "fuelEfficiency": float(fuel_efficiency),
        "fleetUtilization": float(fleet_utilization),
        "operationalCost": float(operational_cost),
        "vehicleROI": float(vehicle_roi),
        "monthlyRevenue": [float(x) for x in monthly_revenue],
        "costliestVehicles": [
            {
                "vehicle": v["vehicle"],
                "cost": float(v["cost"])
            }
            for v in vehicle_costs[:3]
        ]
    }


if __name__ == "__main__":
    import pprint
    pprint.pprint(analytics())