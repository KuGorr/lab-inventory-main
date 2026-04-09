from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# -----------------------------
# USER
# -----------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    is_admin = Column(Boolean, default=False)
    role = Column(String, default="user")  # user, compat, manager, admin


# -----------------------------
# LOCATION
# -----------------------------

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    room = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    containers = relationship("Container", back_populates="location")
    assets = relationship("Asset", back_populates="location")


# -----------------------------
# CONTAINER
# -----------------------------

class Container(Base):
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"))

    # 🔥 NOWE
    status = Column(String, nullable=True)

    location = relationship("Location", back_populates="containers")
    assets = relationship("Asset", back_populates="container")
    history = relationship("ContainerHistory", backref="container")



# -----------------------------
# CONTAINER HISTORY
# -----------------------------

class ContainerHistory(Base):
    __tablename__ = "container_history"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"))
    old_location_id = Column(Integer)
    new_location_id = Column(Integer)
    old_location_name = Column(String)
    new_location_name = Column(String)
    note = Column(String)
    moved_at = Column(DateTime)
    moved_by = Column(String)


# -----------------------------
# ASSET
# -----------------------------

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)

    tag = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    model = Column(String, nullable=True)
    serial = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    comment = Column(String, nullable=True)

    platform = Column(String, nullable=True)
    socket = Column(String, nullable=True)
    cores = Column(Integer, nullable=True)
    threads = Column(Integer, nullable=True)
    base_clock = Column(String, nullable=True)
    memory_clock = Column(String, nullable=True)
    generation = Column(String, nullable=True)
    memory_size = Column(String, nullable=True)
    memory_type = Column(String, nullable=True)
    score = Column(String, nullable=True)

    # 🔥 NOWE
    status = Column(String, nullable=True)

    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)

    location = relationship("Location", back_populates="assets")
    container = relationship("Container", back_populates="assets")
    history = relationship("AssetHistory", back_populates="asset")


# -----------------------------
# ASSET HISTORY
# -----------------------------

class AssetHistory(Base):
    __tablename__ = "asset_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))

    old_location_id = Column(Integer, nullable=True)
    new_location_id = Column(Integer, nullable=True)

    old_location_name = Column(String, nullable=True)
    new_location_name = Column(String, nullable=True)

    note = Column(String, default="")
    moved_at = Column(DateTime, default=datetime.utcnow)

    moved_by = Column(String, nullable=True)

    asset = relationship("Asset", back_populates="history")


# -----------------------------
# ASSET MOVEMENT (opcjonalne)
# -----------------------------

class AssetMovement(Base):
    __tablename__ = "asset_movements"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    from_location_id = Column(Integer, ForeignKey("locations.id"))
    to_location_id = Column(Integer, ForeignKey("locations.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    moved_by = Column(Integer, ForeignKey("users.id"))
