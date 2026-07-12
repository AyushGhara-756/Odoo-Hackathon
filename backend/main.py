from fastapi import FastAPI
from typing import Optional
from src.dashboard import dashboard
from src.drivers import drivers

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

@app.get("/drivers")
def get_drivers(
    status: Optional[str] = None,
    license_category: Optional[str] = None,
    region: Optional[str] = None,
):
    return drivers(
        status=status,
        license_category=license_category,
        region=region
    )