from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import func

from src.db import get_db_sync
from src.modals import Driver, Trip

router = APIRouter(prefix="/drivers", tags=["drivers"])


class DriverCreate(BaseModel):
    name: str
    licenseNo: str
    category: str
    licenseExpiry: str
    contact: str


def driver_to_dict(d: Driver) -> dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "licenseNo": d.licenseNo,
        "category": d.category,
        "licenseExpiry": d.licenseExpiry,
        "contact": d.contact,
        "tripCompletionPct": 0,
        "safetyScorePct": d.safetyScore,
        "status": d.status,
    }


@router.get("")
def list_drivers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    licenseValid: Optional[bool] = None,
    region: Optional[str] = None,
):
    db = get_db_sync()
    q = db.query(Driver)
    if search:
        q = q.filter(
            Driver.name.ilike(f"%{search}%")
            | Driver.licenseNo.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Driver.status == status)
    if region:
        q = q.filter(Driver.region == region)

    drivers = q.all()

    result = []
    for d in drivers:
        data = driver_to_dict(d)
        completed = (
            db.query(func.count(Trip.id))
            .filter(
                Trip.driverId == d.id,
                Trip.status == "Completed",
            )
            .scalar()
        )
        total = (
            db.query(func.count(Trip.id))
            .filter(Trip.driverId == d.id)
            .scalar()
        )
        data["tripCompletionPct"] = round(completed / total * 100, 1) if total else 0
        result.append(data)

    if licenseValid:
        result = [r for r in result if r["licenseExpiry"] >= "2026-01-01"]

    db.close()
    return result


@router.post("")
def create_driver(driver: DriverCreate):
    db = get_db_sync()
    existing = db.query(Driver).filter(Driver.licenseNo == driver.licenseNo).first()
    if existing:
        db.close()
        raise HTTPException(status_code=409, detail="License number already exists")
    d = Driver(
        name=driver.name,
        licenseNo=driver.licenseNo,
        category=driver.category,
        licenseExpiry=driver.licenseExpiry,
        contact=driver.contact,
        safetyScore=100,
        status="Available",
        region="West",
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    result = driver_to_dict(d)
    db.close()
    return result
