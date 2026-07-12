from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session, joinedload

from src.db import get_db_sync
from src.modals import Trip, Vehicle, Driver

router = APIRouter(prefix="/trips", tags=["trips"])

VALID_STATUSES = {"Draft", "Dispatched", "In Transit", "Completed", "Cancelled"}


class TripCreate(BaseModel):
    source: str
    destination: str
    vehicleId: int
    driverId: int
    cargoWeightKg: float
    plannedDistanceKm: float
    region: str = "West"


def trip_to_dict(t: Trip) -> dict:
    return {
        "id": t.tripId,
        "source": t.source,
        "destination": t.destination,
        "vehicleId": str(t.vehicleId) if t.vehicleId else None,
        "vehicleName": t.vehicle.name if t.vehicle else None,
        "driverId": str(t.driverId) if t.driverId else None,
        "driverName": t.driver.name if t.driver else None,
        "cargoWeightKg": t.cargoWeightKg,
        "plannedDistanceKm": t.plannedDistanceKm,
        "status": t.status,
        "eta": t.eta,
        "note": None,
    }


@router.get("")
def list_trips(status: Optional[str] = None, region: Optional[str] = None):
    db = get_db_sync()
    q = db.query(Trip).options(joinedload(Trip.vehicle), joinedload(Trip.driver))
    if status:
        q = q.filter(Trip.status == status)
    if region:
        q = q.filter(Trip.region == region)
    trips = q.order_by(Trip.id.desc()).all()
    db.close()
    return [trip_to_dict(t) for t in trips]


@router.post("")
def create_trip(trip: TripCreate):
    db = get_db_sync()
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicleId).first()
    if not vehicle:
        db.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")

    max_num = 0
    last = db.query(Trip).order_by(Trip.id.desc()).first()
    if last:
        try:
            max_num = int(last.tripId[2:])
        except (ValueError, IndexError):
            pass

    driver = db.query(Driver).filter(Driver.id == trip.driverId).first()

    # Check capacity before dispatch
    if trip.cargoWeightKg > vehicle.capacityKg:
        db.close()
        raise HTTPException(
            status_code=400,
            detail=f"Capacity exceeded: {trip.cargoWeightKg}kg > {vehicle.capacityKg}kg"
        )

    new_trip = Trip(
        tripId=f"TR{max_num + 1:03}",
        source=trip.source,
        destination=trip.destination,
        vehicleId=trip.vehicleId,
        driverId=trip.driverId,
        cargoWeightKg=trip.cargoWeightKg,
        plannedDistanceKm=trip.plannedDistanceKm,
        status="Dispatched",
        eta="In Transit",
        region=trip.region,
        revenue=0,
    )

    vehicle.status = "On Trip"
    if driver:
        driver.status = "On Trip"

    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    result = trip_to_dict(new_trip)
    db.close()
    return result


@router.get("/live")
def live_trips():
    db = get_db_sync()
    trips = (
        db.query(Trip)
        .options(joinedload(Trip.vehicle), joinedload(Trip.driver))
        .filter(Trip.status.in_(["Draft", "Dispatched", "In Transit"]))
        .order_by(Trip.id.desc())
        .all()
    )
    db.close()
    return [trip_to_dict(t) for t in trips]


@router.get("/recent")
def recent_trips(limit: int = 5):
    db = get_db_sync()
    trips = (
        db.query(Trip)
        .options(joinedload(Trip.vehicle), joinedload(Trip.driver))
        .order_by(Trip.id.desc())
        .limit(limit)
        .all()
    )
    db.close()
    return [trip_to_dict(t) for t in trips]


@router.patch("/{trip_id}/dispatch")
def dispatch_trip(trip_id: str):
    db = get_db_sync()
    t = db.query(Trip).options(joinedload(Trip.vehicle), joinedload(Trip.driver)).filter(Trip.tripId == trip_id).first()
    if not t:
        db.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    if t.status != "Draft":
        db.close()
        raise HTTPException(status_code=400, detail=f"Cannot dispatch a trip with status '{t.status}'")

    if t.vehicleId:
        vehicle = db.query(Vehicle).filter(Vehicle.id == t.vehicleId).first()
        if vehicle and t.cargoWeightKg > vehicle.capacityKg:
            db.close()
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Dispatch blocked",
                    "vehicleCapacity": vehicle.capacityKg,
                    "cargoWeight": t.cargoWeightKg,
                    "exceededBy": t.cargoWeightKg - vehicle.capacityKg,
                },
            )

    t.status = "Dispatched"
    t.eta = "In Transit"
    db.commit()
    result = trip_to_dict(t)
    db.close()
    return result


@router.patch("/{trip_id}/complete")
def complete_trip(trip_id: str):
    db = get_db_sync()
    t = db.query(Trip).options(joinedload(Trip.vehicle), joinedload(Trip.driver)).filter(Trip.tripId == trip_id).first()
    if not t:
        db.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    t.status = "Completed"
    if t.vehicleId:
        db.query(Vehicle).filter(Vehicle.id == t.vehicleId).update({"status": "Available"})
    if t.driverId:
        db.query(Driver).filter(Driver.id == t.driverId).update({"status": "Available"})
    db.commit()
    result = trip_to_dict(t)
    db.close()
    return result


@router.patch("/{trip_id}/cancel")
def cancel_trip(trip_id: str):
    db = get_db_sync()
    t = db.query(Trip).options(joinedload(Trip.vehicle), joinedload(Trip.driver)).filter(Trip.tripId == trip_id).first()
    if not t:
        db.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    t.status = "Cancelled"
    if t.vehicleId:
        db.query(Vehicle).filter(Vehicle.id == t.vehicleId).update({"status": "Available"})
    if t.driverId:
        db.query(Driver).filter(Driver.id == t.driverId).update({"status": "Available"})
    db.commit()
    result = trip_to_dict(t)
    db.close()
    return result
