from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import assets, locations, containers, users, map, auth
from .database import Base, engine
from .auth import create_default_admin
from app.utils import hash_password, verify_password
from app.database import Base, engine


# tworzymy tabele, jeśli ich nie ma
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

app.include_router(assets.router)
app.include_router(locations.router)
app.include_router(containers.router)
app.include_router(users.router)
app.include_router(map.router)
app.include_router(auth.router)