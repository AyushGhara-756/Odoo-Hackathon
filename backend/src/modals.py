from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    registrationNumber = Column(String(50), nullable=False)
    name = Column(String(50), nullable=False, unique=True)
    type = Column(String(50), nullable=False)
    region = Column(String(50), nullable=False)
    maxLoadCapacity = Column(Float, nullable=False)
    odometer = Column(Float, default=0)
    acquisitionCost = Column(Float, default=0)
    status = Column(String(50), default="Available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    licenseNumber = Column(String(50), nullable=False, unique=True)
    licenseCategory = Column(String(50), nullable=False)
    licenseExpiry = Column(String(20), nullable=False)
    contactNumber = Column(String(20), nullable=False)
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
    vehicle = Column(String(50), nullable=True)
    driver = Column(String(100), nullable=True)
    cargoWeight = Column(Float, default=0)
    plannedDistance = Column(Float, default=0)
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
