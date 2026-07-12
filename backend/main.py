from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.db import init_db, get_db_sync
from src.auth import router as auth_router, seed_default_users, seed_default_settings, seed_default_rbac
from src.dashboard import router as dashboard_router
from src.drivers import router as drivers_router
from src.trips import router as trips_router
from src.analytics import router as analytics_router
from src.vehicles import router as vehicles_router
from src.maintenance import router as maintenance_router
from src.fuel_logs import router as fuel_logs_router
from src.expenses import router as expenses_router
from src.settings import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        db = get_db_sync()
        try:
            seed_default_users(db)
            seed_default_settings(db)
            seed_default_rbac(db)
            db.commit()
            print("Database initialized and seeded successfully")
        finally:
            db.close()
    except Exception as e:
        print(f"Database initialization skipped: {e}")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(analytics_router)
app.include_router(vehicles_router)
app.include_router(maintenance_router)
app.include_router(fuel_logs_router)
app.include_router(expenses_router)
app.include_router(settings_router)


@app.get("/regions")
def get_regions():
    from src.db import get_db_sync
    from src.modals import Vehicle
    db = get_db_sync()
    rows = db.query(Vehicle.region).distinct().all()
    db.close()
    return [r[0] for r in rows]
