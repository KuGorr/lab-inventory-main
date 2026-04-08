from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from .. import models

router = APIRouter(
    prefix="/map",
    tags=["map"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_full_map(db: Session = Depends(get_db)):
    locations = db.query(models.Location).all()
    containers = db.query(models.Container).all()
    assets = db.query(models.Asset).all()

    # indeksowanie dla szybkości
    containers_by_location = {}
    for c in containers:
        containers_by_location.setdefault(c.location_id, []).append(c)

    assets_by_location = {}
    for a in assets:
        if a.location_id:
            assets_by_location.setdefault(a.location_id, []).append(a)

    assets_by_container = {}
    for a in assets:
        if a.container_id:
            assets_by_container.setdefault(a.container_id, []).append(a)

    # budujemy mapę
    result = []

    for loc in locations:
        loc_entry = {
            "location_id": loc.id,
            "location_code": loc.code,
            "room": loc.room,
            "description": loc.description,
            "containers": [],
            "assets": []
        }

        # assety w szufladzie
        for a in assets_by_location.get(loc.id, []):
            loc_entry["assets"].append({
                "id": a.id,
                "tag": a.tag,
                "type": a.type
            })

        # kontenery w szufladzie
        for c in containers_by_location.get(loc.id, []):
            cont_entry = {
                "id": c.id,
                "code": c.code,
                "description": c.description,
                "assets": []
            }

            # assety w kontenerze
            for a in assets_by_container.get(c.id, []):
                cont_entry["assets"].append({
                    "id": a.id,
                    "tag": a.tag,
                    "type": a.type
                })

            loc_entry["containers"].append(cont_entry)

        result.append(loc_entry)

    return result
