from fastapi import APIRouter
from sqlalchemy import func

from src.db import get_db_sync
from src.models import Trip, Vehicle

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpis")
def analytics_kpis():
    db = get_db_sync()

    completed = db.query(Trip).filter(Trip.status == "Completed").all()
    vehicles = db.query(Vehicle).all()

    total_distance = sum(t.actualDistance or 0 for t in completed)
    total_fuel = sum(t.fuelConsumed or 0 for t in completed)
    total_revenue = sum(t.revenue or 0 for t in completed)
    total_planned = sum(t.plannedDistanceKm or 0 for t in completed)

    fuel_efficiency = round(total_distance / total_fuel, 2) if total_fuel else 0
    on_trip = sum(1 for v in vehicles if v.status == "On Trip")
    fleet_utilization = round(on_trip / len(vehicles) * 100, 2) if vehicles else 0
    operational_cost = round(total_fuel * 90 + total_planned * 5, 2)
    acquisition_cost = sum(v.avgCost or 0 for v in vehicles)
    vehicle_roi = round((total_revenue - operational_cost) / acquisition_cost * 100, 2) if acquisition_cost else 0

    db.close()

    return {
        "fuelEfficiencyKmPerL": float(fuel_efficiency),
        "fleetUtilizationPct": float(fleet_utilization),
        "operationalCost": float(operational_cost),
        "vehicleRoiPct": float(vehicle_roi),
    }


@router.get("/monthly-revenue")
def monthly_revenue():
    db = get_db_sync()
    completed = db.query(Trip).filter(Trip.status == "Completed").all()
    revenues = [float(t.revenue or 0) for t in completed]
    db.close()

    return [
        {"month": f"Trip {i + 1}", "revenue": rev}
        for i, rev in enumerate(revenues)
    ] if revenues else []


@router.get("/top-costliest-vehicles")
def top_costliest():
    db = get_db_sync()
    trips = db.query(Trip).filter(Trip.status == "Completed").all()
    vehicles = {v.name: v for v in db.query(Vehicle).all()}
    db.close()

    costs = {}
    for t in trips:
        if t.vehicleId and t.vehicleId in [v.id for v in vehicles.values()]:
            name = t.vehicle.name if t.vehicle else f"V-{t.vehicleId}"
            fuel_cost = (t.fuelConsumed or 0) * 90
            dist_cost = (t.plannedDistanceKm or 0) * 5
            costs[name] = costs.get(name, 0) + fuel_cost + dist_cost

    sorted_costs = sorted(costs.items(), key=lambda x: x[1], reverse=True)[:3]

    return [
        {"vehicleName": name, "cost": round(cost, 2)}
        for name, cost in sorted_costs
    ]
