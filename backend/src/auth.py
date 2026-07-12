from datetime import datetime, timedelta, timezone
import os
import jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db import get_db_sync
from src.modals import User, Setting, RbacMatrix

SECRET_KEY = os.getenv("JWT_SECRET", "transitops-hackathon-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class MeResponse(BaseModel):
    name: str
    role: str


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        db = get_db_sync()
        user = db.query(User).filter(User.id == user_id).first()
        db.close()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return {"id": user.id, "name": user.name, "role": user.role, "email": user.email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
def login(req: LoginRequest):
    db = get_db_sync()
    user = db.query(User).filter(User.email == req.email).first()
    db.close()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"user_id": user.id})
    return LoginResponse(
        token=token,
        user={"name": user.name, "role": user.role}
    )


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return MeResponse(name=current_user["name"], role=current_user["role"])


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


def seed_default_users(db: Session):
    existing = db.query(User).count()
    if existing > 0:
        return
    defaults = [
        {"email": "fleet@transitops.com", "password": "fleet123", "name": "Alice (Fleet Manager)", "role": "Fleet Manager"},
        {"email": "dispatch@transitops.com", "password": "dispatch123", "name": "Bob (Dispatcher)", "role": "Dispatcher"},
        {"email": "safety@transitops.com", "password": "safety123", "name": "Carol (Safety Officer)", "role": "Safety Officer"},
        {"email": "finance@transitops.com", "password": "finance123", "name": "Dave (Financial Analyst)", "role": "Financial Analyst"},
    ]
    for u in defaults:
        db.add(User(
            email=u["email"],
            password_hash=hash_password(u["password"]),
            name=u["name"],
            role=u["role"],
        ))


def seed_default_settings(db: Session):
    if db.query(Setting).count() > 0:
        return
    db.add(Setting(depotName="Main Depot", currency="INR", distanceUnit="km"))


def seed_default_rbac(db: Session):
    if db.query(RbacMatrix).count() > 0:
        return
    rows = [
        RbacMatrix(role="Fleet Manager", fleet="full", drivers="full", trips="full", fuelExpenses="full", analytics="full"),
        RbacMatrix(role="Dispatcher", fleet="view", drivers="view", trips="full", fuelExpenses="none", analytics="none"),
        RbacMatrix(role="Safety Officer", fleet="none", drivers="full", trips="view", fuelExpenses="none", analytics="none"),
        RbacMatrix(role="Financial Analyst", fleet="none", drivers="none", trips="none", fuelExpenses="full", analytics="full"),
    ]
    for r in rows:
        db.add(r)
