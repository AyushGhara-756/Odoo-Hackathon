from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import func

from src.db import get_db_sync
from src.models import Expense, FuelLog, MaintenanceRecord

router = APIRouter(prefix="/expenses", tags=["expenses"])


class ExpenseCreate(BaseModel):
    vehicleId: int
    tripId: Optional[str] = None
    toll: float = 0
    other: float = 0


def expense_to_dict(e: Expense) -> dict:
    total = e.toll + e.other + e.maintenanceLinked
    return {
        "id": str(e.id),
        "tripId": str(e.tripId) if e.tripId else "",
        "vehicleName": e.vehicle.name if e.vehicle else "",
        "toll": e.toll,
        "other": e.other,
        "maintenanceLinked": e.maintenanceLinked,
        "total": total,
        "status": "Completed",
    }


@router.get("")
def list_expenses(search: Optional[str] = None):
    db = get_db_sync()
    q = db.query(Expense).order_by(Expense.id.desc())
    expenses = q.all()
    for e in expenses:
        _ = e.vehicle
    db.close()
    return [expense_to_dict(e) for e in expenses]


@router.post("")
def create_expense(exp: ExpenseCreate):
    db = get_db_sync()
    e = Expense(
        vehicleId=exp.vehicleId,
        tripId=int(exp.tripId) if exp.tripId and exp.tripId.isdigit() else None,
        toll=exp.toll,
        other=exp.other,
        date="",
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    result = expense_to_dict(e)
    db.close()
    return result


@router.get("/summary")
def expense_summary():
    db = get_db_sync()
    fuel_total = db.query(func.coalesce(func.sum(FuelLog.cost), 0)).scalar()
    maint_total = db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).scalar()
    toll_total = db.query(func.coalesce(func.sum(Expense.toll), 0)).scalar()
    other_total = db.query(func.coalesce(func.sum(Expense.other), 0)).scalar()
    total = float(fuel_total) + float(maint_total) + float(toll_total) + float(other_total)
    db.close()
    return {"totalOperationalCost": round(total, 2)}
