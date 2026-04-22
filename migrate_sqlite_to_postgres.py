import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import (
    User, Location, Container, ContainerHistory,
    Asset, AssetHistory, AssetMovement
)
from app.database import Base

from dotenv import load_dotenv
load_dotenv()

# -----------------------------
# CONFIG
# -----------------------------

SQLITE_PATH = "/app/app.db"   # <-- poprawiona ścieżka
POSTGRES_URL = os.getenv("DATABASE_URL")

if not POSTGRES_URL:
    raise RuntimeError("DATABASE_URL is not set in backend/.env")

# -----------------------------
# CONNECT TO SQLITE
# -----------------------------

sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

# -----------------------------
# CONNECT TO POSTGRES
# -----------------------------

pg_engine = create_engine(POSTGRES_URL)
PGSession = sessionmaker(bind=pg_engine)
pg_session = PGSession()

# -----------------------------
# CREATE TABLES IN POSTGRES
# -----------------------------

Base.metadata.create_all(bind=pg_engine)
print(">>> PostgreSQL tables created.")

# -----------------------------
# MIGRATION HELPERS
# -----------------------------

def fetch_all(table):
    sqlite_cur.execute(f"SELECT * FROM {table}")
    return sqlite_cur.fetchall()

def commit(obj):
    pg_session.add(obj)

# -----------------------------
# MIGRATE USERS
# -----------------------------

print(">>> Migrating users...")
for row in fetch_all("users"):
    user = User(
        id=row["id"],
        username=row["username"],
        password_hash=row["password_hash"],
        is_admin=row["is_admin"],
        role=row["role"],
    )
    commit(user)

pg_session.commit()
print(">>> Users migrated.")

# -----------------------------
# MIGRATE LOCATIONS
# -----------------------------

print(">>> Migrating locations...")
for row in fetch_all("locations"):
    loc = Location(
        id=row["id"],
        code=row["code"],
        room=row["room"],
        description=row["description"],
    )
    commit(loc)

pg_session.commit()
print(">>> Locations migrated.")

# -----------------------------
# MIGRATE CONTAINERS
# -----------------------------

print(">>> Migrating containers...")
for row in fetch_all("containers"):
    cont = Container(
        id=row["id"],
        code=row["code"],
        description=row["description"],
        comment=row["comment"],
        location_id=row["location_id"],
        status=row["status"],
    )
    commit(cont)

pg_session.commit()
print(">>> Containers migrated.")

# -----------------------------
# MIGRATE CONTAINER HISTORY
# -----------------------------

print(">>> Migrating container history...")
for row in fetch_all("container_history"):
    hist = ContainerHistory(
        id=row["id"],
        container_id=row["container_id"],
        old_location_id=row["old_location_id"],
        new_location_id=row["new_location_id"],
        old_location_name=row["old_location_name"],
        new_location_name=row["new_location_name"],
        note=row["note"],
        moved_at=row["moved_at"],
        moved_by=row["moved_by"],
    )
    commit(hist)

pg_session.commit()
print(">>> Container history migrated.")

# -----------------------------
# MIGRATE ASSETS
# -----------------------------

print(">>> Migrating assets...")
for row in fetch_all("assets"):
    asset = Asset(
        id=row["id"],
        tag=row["tag"],
        name=row["name"],
        type=row["type"],
        model=row["model"],
        serial=row["serial"],
        manufacturer=row["manufacturer"],
        notes=row["notes"],
        comment=row["comment"],
        platform=row["platform"],
        socket=row["socket"],
        cores=row["cores"],
        threads=row["threads"],
        base_clock=row["base_clock"],
        memory_clock=row["memory_clock"],
        generation=row["generation"],
        memory_size=row["memory_size"],
        memory_type=row["memory_type"],
        score=row["score"],
        status=row["status"],
        location_id=row["location_id"],
        container_id=row["container_id"],
    )
    commit(asset)

pg_session.commit()
print(">>> Assets migrated.")

# -----------------------------
# MIGRATE ASSET HISTORY
# -----------------------------

print(">>> Migrating asset history...")
for row in fetch_all("asset_history"):
    hist = AssetHistory(
        id=row["id"],
        asset_id=row["asset_id"],
        old_location_id=row["old_location_id"],
        new_location_id=row["new_location_id"],
        old_location_name=row["old_location_name"],
        new_location_name=row["new_location_name"],
        note=row["note"],
        moved_at=row["moved_at"],
        moved_by=row["moved_by"],
    )
    commit(hist)

pg_session.commit()
print(">>> Asset history migrated.")

# -----------------------------
# MIGRATE ASSET MOVEMENTS
# -----------------------------

print(">>> Migrating asset movements...")
for row in fetch_all("asset_movements"):
    mov = AssetMovement(
        id=row["id"],
        asset_id=row["asset_id"],
        from_location_id=row["from_location_id"],
        to_location_id=row["to_location_id"],
        timestamp=row["timestamp"],
        moved_by=row["moved_by"],
    )
    commit(mov)

pg_session.commit()
print(">>> Asset movements migrated.")

# -----------------------------
# DONE
# -----------------------------

print(">>> MIGRATION COMPLETE.")
pg_session.close()
sqlite_conn.close()
