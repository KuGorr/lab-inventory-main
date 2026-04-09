from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models, schemas
from ..auth import require_role

# 🔥 WEBSOCKET BROADCAST
from .ws import broadcast_locations_update

router = APIRouter(
    prefix="/locations",
    tags=["locations"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# LIST ALL LOCATIONS (everyone)
# -----------------------------
@router.get("/", response_model=list[schemas.LocationRead])
def list_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()


# -----------------------------
# CREATE LOCATION (manager+)
# -----------------------------
@router.post(
    "/", 
    response_model=schemas.LocationRead,
    dependencies=[Depends(require_role("manager"))]
)
async def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Location).filter(models.Location.code == location.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location with this code already exists")

    loc = models.Location(
        code=location.code,
        description=location.description
    )

    db.add(loc)
    db.commit()
    db.refresh(loc)

    # 🔥 POWIADOM WSZYSTKICH O ZMIANIE
    await broadcast_locations_update()

    return loc


# -----------------------------
# DELETE LOCATION (admin only)
# -----------------------------
@router.delete(
    "/{location_id}",
    dependencies=[Depends(require_role("admin"))]
)
async def delete_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    db.delete(loc)
    db.commit()

    # 🔥 POWIADOM WSZYSTKICH O ZMIANIE
    await broadcast_locations_update()

    return {"status": "deleted"}


# -----------------------------
# GET LOCATION CONTENTS (everyone)
# -----------------------------
@router.get("/{location_id}/contents")
def get_location_contents(location_id: int, db: Session = Depends(get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    containers = (
        db.query(models.Container)
        .filter(models.Container.location_id == location_id)
        .all()
    )

    assets = (
        db.query(models.Asset)
        .filter(models.Asset.location_id == location_id)
        .all()
    )

    return {
        "location": location.code,
        "containers": [{"id": c.id, "code": c.code} for c in containers],
        "assets": [{"id": a.id, "tag": a.tag} for a in assets]
    }
