from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importy routerów z katalogu routers/
from .routers import assets, locations, containers, users, map, ws

# Poprawny import auth — z app/auth.py, NIE z routers/
from . import auth

from .database import Base, engine
from .auth import create_default_admin

# Tworzymy tabele, jeśli ich nie ma
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # lub dokładnie Twój frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_default_admin()

# REST API
app.include_router(auth.router)          # <-- poprawny router auth
app.include_router(assets.router)
app.include_router(locations.router)
app.include_router(containers.router)
app.include_router(users.router)
app.include_router(map.router)

# WEBSOCKETY
app.include_router(ws.router)
