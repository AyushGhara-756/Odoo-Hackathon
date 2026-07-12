from fastapi import APIRouter
from typing import Optional
from sqlalchemy import func

from src.db import get_db_sync
from src.models import Vehicle, Driver, Trip

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def vehicle_status_breakdown(db) -> dict:
    rows = (
        db.query(Vehicle.status, func.count(Vehicle.id))
        .group_by(Vehicle.status)
        .all()
    )
    breakdown = {"Available": 0, "On Trip": 0, "In Shop": 0, "Retired": 0}
    for status, count in rows:
        breakdown[status] = count
    return breakdown


@router.get("/summary")
def dashboard_summary(
    vehicleType: Optional[str] = None,
    status: Optional[str] = None,
    region: Optional[str] = None,
):
    db = get_db_sync()

    vq = db.query(Vehicle)
    dq = db.query(Driver)
    tq = db.query(Trip)

    if vehicleType:
        vq = vq.filter(Vehicle.type == vehicleType)
    if status:
        vq = vq.filter(Vehicle.status == status)
    if region:
        vq = vq.filter(Vehicle.region == region)
        dq = dq.filter(Driver.region == region)
        tq = tq.filter(Trip.region == region)

    vehicles = vq.all()
    drivers = dq.all()
    trips = tq.all()

    active_vehicles = sum(1 for v in vehicles if v.status == "On Trip")
    available_vehicles = sum(1 for v in vehicles if v.status == "Available")
    in_maintenance = sum(1 for v in vehicles if v.status == "In Shop")
    active_trips = sum(1 for t in trips if t.status in ("Dispatched", "In Transit"))
    pending_trips = sum(1 for t in trips if t.status == "Draft")
    drivers_on_duty = sum(1 for d in drivers if d.status in ("Available", "On Trip"))
    fleet_utilization = round(active_vehicles / len(vehicles) * 100, 2) if vehicles else 0

    recent = (
        db.query(Trip)
        .order_by(Trip.id.desc())
        .limit(5)
        .all()
    )
    recent_trips = [
        {
            "id": t.tripId,
            "vehicleName": t.vehicle.name if t.vehicle else "--",
            "driverName": t.driver.name if t.driver else "--",
            "status": t.status,
            "eta": t.eta,
        }
        for t in recent
    ]

    breakdown = vehicle_status_breakdown(db)

    db.close()

    return {
        "activeVehicles": active_vehicles,
        "availableVehicles": available_vehicles,
        "vehiclesInMaintenance": in_maintenance,
        "activeTrips": active_trips,
        "pendingTrips": pending_trips,
        "driversOnDuty": drivers_on_duty,
        "fleetUtilizationPct": fleet_utilization,
        "vehicleStatusBreakdown": breakdown,
        "recentTrips": recent_trips,
    }
