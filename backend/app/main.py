from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importy routerów z katalogu routers/
from app.routers import assets, locations, containers, users, map, ws, export, admin

# Import auth z backend/app/auth.py
from app import auth

from app.database import Base, engine
from app.auth import create_default_admin

# Tworzymy tabele, jeśli ich nie ma
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Możesz zawęzić do frontendu PROD
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_default_admin()

# REST API
app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(locations.router)
app.include_router(containers.router)
app.include_router(users.router)
app.include_router(map.router)

# 🔥 NOWY ROUTER — eksport CSV
app.include_router(export.router)

# 🔥 NOWY ROUTER — reset statusów
app.include_router(admin.router)

# WEBSOCKETY
app.include_router(ws.router)
