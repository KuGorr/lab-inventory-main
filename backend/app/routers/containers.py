from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from datetime import datetime
from ..database import SessionLocal, get_db
from .. import models, schemas
from ..auth import require_role

# 🔥 IMPORT WEBSOCKET BROADCAST
from .ws import (
    broadcast_containers_update,
    broadcast_assets_update,
    broadcast_history_update
)

router = APIRouter(
    prefix="/containers",
    tags=["containers"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# LIST ALL CONTAINERS (everyone)
# -----------------------------
@router.get("/", response_model=list[schemas.ContainerRead])
def list_containers(db: Session = Depends(get_db)):
    containers = (
        db.query(models.Container)
        .options(
            selectinload(models.Container.location),
            selectinload(models.Container.assets)
        )
        .all()
    )
    return containers


# -----------------------------
# CREATE CONTAINER (manager+)
# -----------------------------
@router.post(
    "/", 
    response_model=schemas.ContainerRead,
    dependencies=[Depends(require_role("manager"))]
)
async def create_container(container: schemas.ContainerCreate, db: Session = Depends(get_db)):

    existing = db.query(models.Container).filter(models.Container.code == container.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Container with this code already exists")

    cont = models.Container(
        code=container.code,
        description=container.description,
        comment=container.comment,
        location_id=container.location_id,
        status=None  # 🔥 domyślnie brak statusu
    )
    db.add(cont)
    db.commit()
    db.refresh(cont)

    await broadcast_containers_update()
    await broadcast_history_update()

    return cont


# -----------------------------
# DELETE CONTAINER (admin only)
# -----------------------------
@router.delete(
    "/{container_id}",
    dependencies=[Depends(require_role("admin"))]
)
async def delete_container(container_id: int, db: Session = Depends(get_db)):
    cont = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not cont:
        raise HTTPException(status_code=404, detail="Container not found")

    assets = db.query(models.Asset).filter(models.Asset.container_id == container_id).all()
    if assets:
        raise HTTPException(status_code=400, detail="Cannot delete non-empty container")

    db.delete(cont)
    db.commit()

    await broadcast_containers_update()
    await broadcast_history_update()

    return {"status": "deleted"}


# -----------------------------
# 🔥 UPDATE COMMENT (compat+)
# -----------------------------
@router.post(
    "/{container_id}/comment",
    dependencies=[Depends(require_role("compat"))]
)
async def update_container_comment(
    container_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    cont = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not cont:
        raise HTTPException(status_code=404, detail="Container not found")

    cont.comment = data.get("comment", "")
    db.commit()

    await broadcast_containers_update()
    await broadcast_assets_update()
    await broadcast_history_update()

    return {"status": "ok", "comment": cont.comment}


# -----------------------------
# 🔥 NOWE: UPDATE STATUS (compat+)
# -----------------------------
@router.post(
    "/{container_id}/status",
    dependencies=[Depends(require_role("compat"))]
)
async def update_container_status(
    container_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    cont = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not cont:
        raise HTTPException(status_code=404, detail="Container not found")

    new_status = data.get("status")

    allowed = ["available", "borrowed", "broken", "lost", None]

    if new_status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    cont.status = new_status
    db.commit()

    await broadcast_containers_update()

    return {"status": "ok", "new_status": new_status}


# -----------------------------
# MOVE CONTAINER (compat+)
# -----------------------------
@router.post(
    "/{container_id}/move",
    dependencies=[Depends(require_role("compat"))]
)
async def move_container(
    container_id: int,
    req: schemas.MoveAssetRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("compat"))
):
    container = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")

    location = db.query(models.Location).filter(models.Location.code == req.target).first()
    if not location:
        raise HTTPException(status_code=400, detail="Kontener można przenieść tylko do lokalizacji")

    old_location = container.location_id
    old_location_name = container.location.code if container.location else None

    container.location_id = location.id

    cont_history = models.ContainerHistory(
        container_id=container.id,
        old_location_id=old_location,
        new_location_id=location.id,
        old_location_name=old_location_name,
        new_location_name=location.code,
        note=req.note or "",
        moved_at=datetime.utcnow(),
        moved_by=current_user.username
    )
    db.add(cont_history)

    assets = db.query(models.Asset).filter(models.Asset.container_id == container_id).all()

    for asset in assets:
        asset.location_id = location.id

        history = models.AssetHistory(
            asset_id=asset.id,
            old_location_id=old_location,
            new_location_id=location.id,
            old_location_name=old_location_name,
            new_location_name=location.code,
            note=f"Przeniesiono wraz z kontenerem {container.code}. {req.note or ''}",
            moved_at=datetime.utcnow(),
            moved_by=current_user.username
        )
        db.add(history)

    db.commit()

    await broadcast_containers_update()
    await broadcast_assets_update()
    await broadcast_history_update()

    return {
        "status": "ok",
        "container": container.code,
        "new_location": location.code,
        "moved_assets": len(assets)
    }


# -----------------------------
# GET CONTAINER HISTORY
# -----------------------------
@router.get("/{container_id}/history")
def get_container_history(
    container_id: int,
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db)
):
    if page < 1:
        page = 1

    container = db.query(models.Container).filter(models.Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")

    query = (
        db.query(models.ContainerHistory)
        .filter(models.ContainerHistory.container_id == container_id)
    )

    total = query.count()
    offset = (page - 1) * limit

    rows = (
        query.order_by(models.ContainerHistory.moved_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for h in rows:
        items.append({
            "id": h.id,
            "old_location_name": h.old_location_name,
            "new_location_name": h.new_location_name,
            "note": h.note,
            "moved_at": h.moved_at,
            "moved_by": h.moved_by,
        })

    pages = (total + limit - 1) // limit

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit
    }


# -----------------------------
# GET CONTAINER DETAILS
# -----------------------------
@router.get("/{container_id}")
def get_container(container_id: int, db: Session = Depends(get_db)):
    container = (
        db.query(models.Container)
        .filter(models.Container.id == container_id)
        .first()
    )
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")

    assets = (
        db.query(models.Asset)
        .filter(models.Asset.container_id == container_id)
        .all()
    )

    return {
        "id": container.id,
        "code": container.code,
        "description": container.description,
        "comment": container.comment,
        "status": container.status,  # 🔥 dodane
        "location": container.location,
        "assets": assets
    }
