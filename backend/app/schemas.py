print(">>> Nowy SCHEMAS.PY Na Test<<<")

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# -------------------------
# USER SCHEMAS
# -------------------------

class UserBase(BaseModel):
    username: str
    role: str

    # 🔥 NOWE — email użytkownika
    email: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    is_admin: bool

    model_config = {"from_attributes": True}


# -------------------------
# PASSWORD CHANGE
# -------------------------

class PasswordChange(BaseModel):
    new_password: str


# -------------------------
# LOCATION SCHEMAS
# -------------------------

class LocationBase(BaseModel):
    code: str
    description: Optional[str] = None


class LocationCreate(LocationBase):
    pass


class LocationRead(LocationBase):
    id: int
    model_config = {"from_attributes": True}


# -------------------------
# CONTAINER SCHEMAS
# -------------------------

class ContainerBase(BaseModel):
    code: str
    description: Optional[str] = None
    comment: Optional[str] = None

    # 🔥 NOWE — status kontenera
    status: Optional[str] = None


class ContainerCreate(ContainerBase):
    location_id: int


class ContainerRead(ContainerBase):
    id: int
    location: Optional[LocationRead]
    comment: Optional[str] = None
    model_config = {"from_attributes": True}


# -------------------------
# ASSET SCHEMAS
# -------------------------

class AssetBase(BaseModel):
    tag: str | None = None
    name: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    type: str | None = None
    platform: str | None = None
    socket: str | None = None
    generation: str | None = None
    memory_size: str | None = None
    memory_type: str | None = None
    notes: str | None = None

    cores: int | None = None
    threads: int | None = None
    base_clock: float | None = None
    memory_clock: float | None = None
    score: float | None = None

    # 🔥 NOWE — komentarz assetu
    comment: Optional[str] = None

    # 🔥 NOWE — status assetu
    status: Optional[str] = None


class AssetCreate(AssetBase):
    location_id: int | None = None
    container_id: int | None = None


class AssetUpdate(AssetBase):
    pass


class AssetRead(AssetBase):
    id: int
    location: Optional[LocationRead]
    container: Optional[ContainerRead]

    model_config = {"from_attributes": True}


# -------------------------
# MOVE ASSET
# -------------------------

class MoveAssetRequest(BaseModel):
    target: str
    note: Optional[str] = ""


# -------------------------
# ASSET HISTORY
# -------------------------

class AssetHistoryRead(BaseModel):
    id: int
    asset_id: int

    old_location_id: Optional[int]
    new_location_id: Optional[int]

    old_location_name: Optional[str]
    new_location_name: Optional[str]

    note: Optional[str]
    moved_by: Optional[str]
    moved_at: datetime

    model_config = {"from_attributes": True}
