import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Wczytujemy zmienne z pliku .env
load_dotenv()

# Pobieramy URL bazy z .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check backend/.env")

# Tworzymy silnik PostgreSQL
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

# Fabryka sesji
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Bazowa klasa modeli
Base = declarative_base()

# Dependency dla FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
