from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.db import get_db_sync
from src.modals import MaintenanceRecord, Vehicle

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


class MaintenanceCreate(BaseModel):
    vehicleId: int
    serviceType: str
    cost: float
    date: str
    status: str = "In Shop"


def record_to_dict(r: MaintenanceRecord) -> dict:
    return {
        "id": str(r.id),
        "vehicleId": str(r.vehicleId),
        "vehicleName": r.vehicle.name if r.vehicle else "",
        "serviceType": r.serviceType,
        "cost": r.cost,
        "date": r.date,
        "status": r.status,
    }


@router.get("")
def list_maintenance(search: Optional[str] = None):
    db = get_db_sync()
    q = db.query(MaintenanceRecord)
    if search:
        q = q.filter(
            MaintenanceRecord.serviceType.ilike(f"%{search}%")
        )
    records = q.order_by(MaintenanceRecord.id.desc()).all()
    # eagerly load vehicles
    for r in records:
        _ = r.vehicle
    db.close()
    return [record_to_dict(r) for r in records]


@router.get("/service-types")
def service_types():
    db = get_db_sync()
    rows = db.query(MaintenanceRecord.serviceType).distinct().all()
    db.close()
    types = [r[0] for r in rows]
    if not types:
        types = ["Oil Change", "Engine Repair", "Tyre Replace", "Brake Service"]
    return types


@router.post("")
def create_maintenance(rec: MaintenanceCreate):
    db = get_db_sync()
    vehicle = db.query(Vehicle).filter(Vehicle.id == rec.vehicleId).first()
    if not vehicle:
        db.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    m = MaintenanceRecord(
        vehicleId=rec.vehicleId,
        serviceType=rec.serviceType,
        cost=rec.cost,
        date=rec.date,
        status=rec.status,
    )
    if rec.status == "In Shop":
        vehicle.status = "In Shop"
    db.add(m)
    db.commit()
    db.refresh(m)
    result = record_to_dict(m)
    db.close()
    return result


@router.patch("/{record_id}/close")
def close_maintenance(record_id: int):
    db = get_db_sync()
    rec = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not rec:
        db.close()
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    rec.status = "Completed"
    vehicle = db.query(Vehicle).filter(Vehicle.id == rec.vehicleId).first()
    if vehicle:
        vehicle.status = "Available"
    db.commit()
    result = record_to_dict(rec)
    db.close()
    return result
