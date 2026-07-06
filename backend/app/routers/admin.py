from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Asset, Container

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/reset-assets-status")
def reset_assets_status(db: Session = Depends(get_db)):
    updated = (
        db.query(Asset)
        .filter(Asset.status == "available")
        .update({Asset.status: None})
    )
    db.commit()
    return {"updated": updated}

@router.post("/reset-containers-status")
def reset_containers_status(db: Session = Depends(get_db)):
    updated = (
        db.query(Container)
        .filter(Container.status == "available")
        .update({Container.status: None})
    )
    db.commit()
    return {"updated": updated}
