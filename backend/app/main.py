from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importy routerów z katalogu routers/
from backend.app.routers import assets, locations, containers, users, map, ws

# Import auth z backend/app/auth.py
from backend.app import auth

from backend.app.database import Base, engine
from backend.app.auth import create_default_admin

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

# WEBSOCKETY
app.include_router(ws.router)
