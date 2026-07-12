from fastapi import FastAPI
from typing import Optional
from src.dashboard import dashboard

app = FastAPI()


@app.get("/dashboard")
def get_dashboard(
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    region: Optional[str] = None,
):
    return dashboard(
        status=status,
        vehicle_type=vehicle_type,
        region=region
    )