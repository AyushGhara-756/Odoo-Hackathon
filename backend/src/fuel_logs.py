from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from src.db import get_db_sync
from src.models import FuelLog, Vehicle

router = APIRouter(prefix="/fuel-logs", tags=["fuel-logs"])


class FuelLogCreate(BaseModel):
    vehicleId: int
    date: str
    liters: float
    cost: float


def log_to_dict(f: FuelLog) -> dict:
    return {
        "id": str(f.id),
        "vehicleId": str(f.vehicleId),
        "vehicleName": f.vehicle.name if f.vehicle else "",
        "date": f.date,
        "liters": f.liters,
        "cost": f.cost,
    }


@router.get("")
def list_fuel_logs(
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
):
    db = get_db_sync()
    q = db.query(FuelLog)
    if search:
        q = q.outerjoin(Vehicle).filter(
            FuelLog.date.ilike(f"%{search}%")
            | Vehicle.name.ilike(f"%{search}%")
        )
    sort_map = {
        "date": FuelLog.date,
        "liters": FuelLog.liters,
        "cost": FuelLog.cost,
    }
    sort_col = sort_map.get(sort_by)
    if sort_col:
        q = q.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())
    else:
        q = q.order_by(FuelLog.id.desc())
    logs = q.all()
    for l in logs:
        _ = l.vehicle
    db.close()
    return [log_to_dict(l) for l in logs]


@router.post("")
def create_fuel_log(log: FuelLogCreate):
    db = get_db_sync()
    f = FuelLog(
        vehicleId=log.vehicleId,
        date=log.date,
        liters=log.liters,
        cost=log.cost,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    result = log_to_dict(f)
    db.close()
    return result
