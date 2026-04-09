from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from datetime import datetime
from typing import Optional

from ..database import get_db
from app import models, schemas
from ..auth import require_admin, get_current_user, require_role

# IMPORT WEBSOCKET BROADCAST
from .ws import broadcast_assets_update, broadcast_history_update

router = APIRouter(
    prefix="/assets",
    tags=["assets"]
)

# ---------------------------------------------------------
# GLOBALNA HISTORIA — ASSETY + KONTENERY
# ---------------------------------------------------------
@router.get("/history")
def get_global_history(
    page: int = 1,
    limit: int = 25,
    moved_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if page < 1:
        page = 1

    asset_query = (
        db.query(
            models.AssetHistory,
            models.Asset.id,
            models.Asset.tag,
            models.Asset.name
        )
        .join(models.Asset, models.Asset.id == models.AssetHistory.asset_id)
    )

    if moved_by:
        asset_query = asset_query.filter(models.AssetHistory.moved_by == moved_by)

    asset_rows = asset_query.all()

    asset_items = []
    for h, asset_id, tag, name in asset_rows:
        asset_items.append({
            "type": "asset",
            "asset_id": asset_id,
            "container_id": None,
            "asset_tag": tag,
            "asset_name": name,
            "old_location_name": h.old_location_name,
            "new_location_name": h.new_location_name,
            "moved_by": h.moved_by,
            "moved_at": h.moved_at,
            "note": h.note,
        })

    container_query = (
        db.query(
            models.ContainerHistory,
            models.Container.id,
            models.Container.code,
            models.Container.description
        )
        .join(models.Container, models.Container.id == models.ContainerHistory.container_id)
    )

    if moved_by:
        container_query = container_query.filter(models.ContainerHistory.moved_by == moved_by)

    container_rows = container_query.all()

    container_items = []
    for h, container_id, code, description in container_rows:
        container_items.append({
            "type": "container",
            "asset_id": None,
            "container_id": container_id,
            "asset_tag": code,
            "asset_name": description,
            "old_location_name": h.old_location_name,
            "new_location_name": h.new_location_name,
            "moved_by": h.moved_by,
            "moved_at": h.moved_at,
            "note": h.note,
        })

    combined = asset_items + container_items
    combined.sort(key=lambda x: x["moved_at"], reverse=True)

    total = len(combined)
    pages = (total + limit - 1) // limit

    start = (page - 1) * limit
    end = start + limit

    return {
        "items": combined[start:end],
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit
    }


@router.get("/history/users")
def get_history_users(db: Session = Depends(get_db)):
    users_assets = (
        db.query(models.AssetHistory.moved_by)
        .distinct()
        .all()
    )

    users_containers = (
        db.query(models.ContainerHistory.moved_by)
        .distinct()
        .all()
    )

    merged = {u[0] for u in users_assets if u[0]} | {u[0] for u in users_containers if u[0]}

    return sorted(list(merged))


@router.get("/", response_model=list[schemas.AssetRead])
def get_assets(db: Session = Depends(get_db)):
    assets = (
        db.query(models.Asset)
        .options(
            selectinload(models.Asset.location),
            selectinload(models.Asset.container),
            selectinload(models.Asset.history)
        )
        .all()
    )
    return assets


# ---------------------------------------------------------
# POST /assets — tworzenie assetu
# ---------------------------------------------------------
@router.post("/", response_model=schemas.AssetRead)
async def create_asset(
    asset: schemas.AssetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    existing = db.query(models.Asset).filter(models.Asset.tag == asset.tag).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset with this tag already exists")

    new_asset = models.Asset(**asset.dict())
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    await broadcast_assets_update()
    await broadcast_history_update()

    return new_asset


@router.get("/{asset_id}", response_model=schemas.AssetRead)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = (
        db.query(models.Asset)
        .options(
            selectinload(models.Asset.location),
            selectinload(models.Asset.container),
            selectinload(models.Asset.history)
        )
        .filter(models.Asset.id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return asset


@router.get("/{asset_id}/history")
def get_asset_history(
    asset_id: int,
    page: int = 1,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    if page < 1:
        page = 1

    offset = (page - 1) * limit

    total = (
        db.query(models.AssetHistory)
        .filter(models.AssetHistory.asset_id == asset_id)
        .count()
    )

    history = (
        db.query(models.AssetHistory)
        .filter(models.AssetHistory.asset_id == asset_id)
        .order_by(models.AssetHistory.moved_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for h in history:
        items.append({
            "id": h.id,
            "asset_id": h.asset_id,
            "old_location_id": h.old_location_id,
            "new_location_id": h.new_location_id,
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


# ---------------------------------------------------------
# 🔥 POST /assets/{asset_id}/comment — edycja komentarza
# ---------------------------------------------------------
@router.post("/{asset_id}/comment")
async def update_asset_comment(
    asset_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("compat"))
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.comment = data.get("comment", "")
    db.commit()

    await broadcast_assets_update()
    await broadcast_history_update()

    return {"status": "ok", "comment": asset.comment}


# ---------------------------------------------------------
# 🔥 NOWE: POST /assets/{asset_id}/status — zmiana statusu
# ---------------------------------------------------------
@router.post("/{asset_id}/status")
async def update_asset_status(
    asset_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("compat"))
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    new_status = data.get("status")

    allowed = ["available", "borrowed", "broken", "lost", None]

    if new_status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    asset.status = new_status
    db.commit()

    await broadcast_assets_update()

    return {"status": "ok", "new_status": new_status}


# ---------------------------------------------------------
# POST /assets/{asset_id}/move — przenoszenie assetu
# ---------------------------------------------------------
@router.post("/{asset_id}/move", response_model=schemas.AssetRead)
async def move_asset(
    asset_id: int,
    req: schemas.MoveAssetRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if asset.container_id:
        old_location_id = asset.container.location_id
        old_location_name = asset.container.code
    else:
        old_location_id = asset.location_id
        old_location_name = asset.location.code if asset.location else None

    location = db.query(models.Location).filter(models.Location.code == req.target).first()
    container = db.query(models.Container).filter(models.Container.code == req.target).first()

    if not location and not container:
        raise HTTPException(status_code=400, detail="Nie znaleziono lokalizacji ani kontenera o takim kodzie")

    if location:
        asset.location_id = location.id
        asset.container_id = None

        new_location_id = location.id
        new_location_name = location.code

        history = models.AssetHistory(
            asset_id=asset.id,
            old_location_id=old_location_id,
            new_location_id=new_location_id,
            old_location_name=old_location_name,
            new_location_name=new_location_name,
            note=req.note or "",
            moved_at=datetime.utcnow(),
            moved_by=current_user.username,
        )

        db.add(history)
        db.commit()
        db.refresh(asset)

        await broadcast_assets_update()
        await broadcast_history_update()

        return asset

    if container:
        asset.container_id = container.id
        asset.location_id = container.location_id

        new_location_id = container.location_id
        new_location_name = container.code

        history = models.AssetHistory(
            asset_id=asset.id,
            old_location_id=old_location_id,
            new_location_id=new_location_id,
            old_location_name=old_location_name,
            new_location_name=new_location_name,
            note=req.note or "",
            moved_at=datetime.utcnow(),
            moved_by=current_user.username,
        )

        db.add(history)
        db.commit()
        db.refresh(asset)

        await broadcast_assets_update()
        await broadcast_history_update()

        return asset


@router.delete("/{asset_id}", response_model=dict)
async def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db.query(models.AssetHistory).filter(models.AssetHistory.asset_id == asset_id).delete()

    db.delete(asset)
    db.commit()

    await broadcast_assets_update()
    await broadcast_history_update()

    return {"status": "deleted", "asset_id": asset_id}
