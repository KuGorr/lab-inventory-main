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
        expanded = set(status)

        # 🔥 Jeśli użytkownik wybiera "none", to łapiemy:
        # - "none" (reset)
        # - "unknown" (stare dane)
        # - NULL (inwentaryzacja)
        if "none" in status:
            query = query.filter(
                or_(
                    models.Asset.status == "none",
                    models.Asset.status == "unknown",
                    models.Asset.status.is_(None)
                )
            )
        else:
            query = query.filter(models.Asset.status.in_(expanded))

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
