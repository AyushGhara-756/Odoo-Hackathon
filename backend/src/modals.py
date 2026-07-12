from sqlalchemy import Column, Integer, String, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(200), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    regNo = Column(String(50), nullable=False, unique=True)
    name = Column(String(50), nullable=False)
    type = Column(String(50), nullable=False)
    region = Column(String(50), nullable=False)
    capacityKg = Column(Float, nullable=False)
    odometer = Column(Float, default=0)
    avgCost = Column(Float, default=0)
    status = Column(String(50), default="Available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    licenseNo = Column(String(50), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    licenseExpiry = Column(String(20), nullable=False)
    contact = Column(String(20), nullable=False)
    safetyScore = Column(Integer, default=0)
    region = Column(String(50), nullable=False)
    status = Column(String(50), default="Available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tripId = Column(String(20), nullable=False, unique=True)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driverId = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    cargoWeightKg = Column(Float, default=0)
    plannedDistanceKm = Column(Float, default=0)
    actualDistance = Column(Float, nullable=True)
    fuelConsumed = Column(Float, nullable=True)
    startOdometer = Column(Float, nullable=True)
    endOdometer = Column(Float, nullable=True)
    revenue = Column(Float, default=0)
    status = Column(String(50), default="Draft")
    eta = Column(String(50), default="Awaiting Dispatch")
    region = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    serviceType = Column(String(100), nullable=False)
    description = Column(String(300), nullable=True)
    cost = Column(Float, default=0)
    date = Column(String(20), nullable=False)
    status = Column(String(50), default="In Shop")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vehicle = relationship("Vehicle")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    tripId = Column(Integer, nullable=True)
    liters = Column(Float, default=0)
    cost = Column(Float, default=0)
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    tripId = Column(Integer, nullable=True)
    toll = Column(Float, default=0)
    other = Column(Float, default=0)
    maintenanceLinked = Column(Float, default=0)
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    depotName = Column(String(200), default="Main Depot")
    currency = Column(String(10), default="INR")
    distanceUnit = Column(String(10), default="km")


class RbacMatrix(Base):
    __tablename__ = "rbac_matrix"

    id = Column(Integer, primary_key=True, autoincrement=True)
    role = Column(String(50), nullable=False, unique=True)
    fleet = Column(String(10), default="none")
    drivers = Column(String(10), default="none")
    trips = Column(String(10), default="none")
    fuelExpenses = Column(String(10), default="none")
    analytics = Column(String(10), default="none")
