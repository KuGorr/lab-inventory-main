from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
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

    # Filtr statusów
    if status:
        query = query.filter(models.Asset.status.in_(status))

    assets = query.all()

    # Kolumny z tabeli assets
    columns = [c.name for c in models.Asset.__table__.columns]

    # Dodatkowe kolumny relacyjne
    extra_columns = ["location_code", "container_code"]

    output = StringIO()
    writer = csv.writer(output)

    # Nagłówki
    writer.writerow(columns + extra_columns)

    for asset in assets:
        row = []

        # Kolumny z tabeli
        for col in columns:
            value = getattr(asset, col, "")
            row.append(value if value is not None else "")

        # Lokalizacja
        if asset.location and asset.location.code:
            row.append(asset.location.code)
        else:
            row.append("")

        # Kontener
        if asset.container and asset.container.code:
            row.append(asset.container.code)
        else:
            row.append("")

        writer.writerow(row)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assets_export.csv"}
    )
