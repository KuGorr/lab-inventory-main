from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from io import StringIO
import csv

from app.database import get_db
from app import models

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/assets-csv")
def export_assets_csv(
    status: list[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Asset)

    if status:
        conditions = []

        for s in status:
            # 🔥 none + unknown = jedna grupa
            if s in ("none", "unknown"):
                conditions.append(models.Asset.status.is_(None))
                conditions.append(models.Asset.status == "none")
                conditions.append(models.Asset.status == "unknown")
            else:
                # 🔥 normalne statusy
                conditions.append(models.Asset.status == s)

        # 🔥 jeden wspólny OR dla wszystkich wybranych statusów
        query = query.filter(or_(*conditions))

    assets = query.all()

    columns = [c.name for c in models.Asset.__table__.columns]
    extra_columns = ["location_code", "container_code"]

    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(columns + extra_columns)

    for asset in assets:
        row = []

        for col in columns:
            value = getattr(asset, col, "")
            row.append(value if value is not None else "")

        row.append(asset.location.code if asset.location else "")
        row.append(asset.container.code if asset.container else "")

        writer.writerow(row)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assets_export.csv"}
    )
