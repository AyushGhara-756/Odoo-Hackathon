from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
import re

load_dotenv()

RAW_URL = os.getenv("DATABASE_URL")
if not RAW_URL:
    raise ValueError("DATABASE_URL not set in .env")

# Clean password: strip surrounding brackets if present
match = re.match(r"(postgresql://[^:]+:)(.+)(@.+)$", RAW_URL)
if match:
    user_part = match.group(1)
    password = match.group(2)
    rest = match.group(3)
    # remove wrapping brackets like [password] that may be in the .env
    password = password.strip("[]")
    DATABASE_URL = f"{user_part}{quote_plus(password)}{rest}"
else:
    DATABASE_URL = RAW_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    from src.modals import Base
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_sync() -> Session:
    return SessionLocal()
