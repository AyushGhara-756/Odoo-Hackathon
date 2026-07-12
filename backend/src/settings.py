from fastapi import APIRouter
from pydantic import BaseModel

from src.db import get_db_sync
from src.models import Setting, RbacMatrix

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    depotName: str
    currency: str
    distanceUnit: str


@router.get("")
def get_settings():
    db = get_db_sync()
    s = db.query(Setting).first()
    db.close()
    if not s:
        return {"depotName": "Main Depot", "currency": "INR", "distanceUnit": "km"}
    return {"depotName": s.depotName, "currency": s.currency, "distanceUnit": s.distanceUnit}


@router.patch("")
def update_settings(update: SettingsUpdate):
    db = get_db_sync()
    s = db.query(Setting).first()
    if not s:
        s = Setting(depotName=update.depotName, currency=update.currency, distanceUnit=update.distanceUnit)
        db.add(s)
    else:
        s.depotName = update.depotName
        s.currency = update.currency
        s.distanceUnit = update.distanceUnit
    db.commit()
    db.close()
    return {"message": "Settings updated"}


@router.get("/rbac-matrix")
def rbac_matrix():
    db = get_db_sync()
    rows = db.query(RbacMatrix).all()
    db.close()
    if not rows:
        return [
            {"role": "Fleet Manager", "fleet": "full", "drivers": "full", "trips": "full", "fuelExpenses": "full", "analytics": "full"},
            {"role": "Dispatcher", "fleet": "view", "drivers": "view", "trips": "full", "fuelExpenses": "none", "analytics": "none"},
            {"role": "Safety Officer", "fleet": "none", "drivers": "full", "trips": "view", "fuelExpenses": "none", "analytics": "none"},
            {"role": "Financial Analyst", "fleet": "none", "drivers": "none", "trips": "none", "fuelExpenses": "full", "analytics": "full"},
        ]
    return [
        {
            "role": r.role,
            "fleet": r.fleet,
            "drivers": r.drivers,
            "trips": r.trips,
            "fuelExpenses": r.fuelExpenses,
            "analytics": r.analytics,
        }
        for r in rows
    ]
