from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.db import get_db_sync
from src.modals import Vehicle

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


class VehicleCreate(BaseModel):
    regNo: str
    makeModel: str
    type: str
    capacityKg: float
    odometer: float
    avgCost: float


def vehicle_to_dict(v: Vehicle) -> dict:
    return {
        "id": str(v.id),
        "regNo": v.regNo,
        "makeModel": v.name,
        "type": v.type,
        "capacityKg": v.capacityKg,
        "odometer": v.odometer,
        "avgCost": v.avgCost,
        "status": v.status,
    }


@router.get("")
def list_vehicles(
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
):
    db = get_db_sync()
    q = db.query(Vehicle)
    if search:
        q = q.filter(
            Vehicle.regNo.ilike(f"%{search}%")
            | Vehicle.name.ilike(f"%{search}%")
        )
    if type:
        q = q.filter(Vehicle.type == type)
    if status:
        q = q.filter(Vehicle.status == status)
    vehicles = q.all()
    db.close()
    return [vehicle_to_dict(v) for v in vehicles]


@router.get("/types")
def vehicle_types():
    db = get_db_sync()
    rows = db.query(Vehicle.type).distinct().all()
    db.close()
    return [r[0] for r in rows]


@router.post("")
def create_vehicle(v: VehicleCreate):
    db = get_db_sync()
    existing = db.query(Vehicle).filter(Vehicle.regNo == v.regNo).first()
    if existing:
        db.close()
        raise HTTPException(status_code=409, detail="Registration number already exists")
    vehicle = Vehicle(
        regNo=v.regNo,
        name=v.makeModel,
        type=v.type,
        capacityKg=v.capacityKg,
        odometer=v.odometer,
        avgCost=v.avgCost,
        status="Available",
        region="West",
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    result = vehicle_to_dict(vehicle)
    db.close()
    return result


@router.get("/regions")
def regions():
    db = get_db_sync()
    rows = db.query(Vehicle.region).distinct().all()
    db.close()
    return [r[0] for r in rows]
