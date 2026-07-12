from fastapi import FastAPI
from typing import Optional
from pydantic import BaseModel
from src.dashboard import dashboard
from src.drivers import drivers
from src.trips import trips, create_trip, dispatch_trip, update_trip_status


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

class Trip(BaseModel):
    source: str
    destination: str
    vehicle: str
    driver: str
    cargo_weight: int
    planned_distance: int
    region: str


@app.get("/trips")
def get_trips(
    status: Optional[str] = None,
    region: Optional[str] = None,
):
    return trips(status, region)


@app.post("/trips")
def add_trip(trip: Trip):
    return create_trip(
        trip.source,
        trip.destination,
        trip.vehicle,
        trip.driver,
        trip.cargo_weight,
        trip.planned_distance,
        trip.region,
    )


@app.patch("/trips/{trip_id}")
def change_trip_status(
    trip_id: str,
    status: str,
):
    return update_trip_status(trip_id, status)


class Trip(BaseModel):
    source: str
    destination: str
    vehicle: str
    driver: str
    cargo_weight: int
    planned_distance: int
    region: str


class StatusUpdate(BaseModel):
    status: str


@app.get("/trips")
def get_trips(
    status: Optional[str] = None,
    region: Optional[str] = None,
):
    return trips(status, region)


@app.post("/trips")
def add_trip(trip: Trip):
    return create_trip(
        source=trip.source,
        destination=trip.destination,
        vehicle=trip.vehicle,
        driver=trip.driver,
        cargo_weight=trip.cargo_weight,
        planned_distance=trip.planned_distance,
        region=trip.region,
    )


@app.patch("/trips/{trip_id}/dispatch")
def dispatch(trip_id: str):
    return dispatch_trip(trip_id)


@app.patch("/trips/{trip_id}")
def change_status(
    trip_id: str,
    status: StatusUpdate,
):
    return update_trip_status(
        trip_id,
        status.status,
    )