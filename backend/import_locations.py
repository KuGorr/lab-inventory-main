import csv
import requests

API_URL = "http://10.19.148.12:8000/locations/"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NTgzMDk4Mn0.an2IFn6L0H1PvW98V90P742Np4zQ04_7lvDlBcST308"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

with open("locations.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    # 🔥 Normalizacja nagłówków (usuwa BOM, spacje, duże litery)
    normalized_headers = [h.strip().lower().replace("\ufeff", "") for h in reader.fieldnames]
    reader.fieldnames = normalized_headers

    print("Wykryte nagłówki:", reader.fieldnames)

    for row in reader:
        payload = {
            "code": row["code"].strip(),
            "room": row["room"].strip() if row["room"] else None,
            "description": row["description"].strip() if row["description"] else None
        }

        r = requests.post(API_URL, json=payload, headers=headers)

        if r.status_code == 200:
            print(f"✔ Dodano lokalizację: {payload['code']}")
        else:
            print(f"❌ Błąd przy {payload['code']}: {r.status_code} {r.text}")
