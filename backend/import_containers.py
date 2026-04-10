import csv
import requests

API_URL = "http://10.19.148.12:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NTgzMDk4Mn0.an2IFn6L0H1PvW98V90P742Np4zQ04_7lvDlBcST308"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

# 1. Pobieramy wszystkie lokalizacje, żeby zrobić mapę code → id
print("Pobieram lokalizacje...")
loc_res = requests.get(f"{API_URL}/locations/")
locations = loc_res.json()

location_map = {loc["code"]: loc["id"] for loc in locations}

print(f"Znaleziono {len(location_map)} lokalizacji.")

# 2. Import kontenerów
with open("containers.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    # Normalizacja nagłówków
    reader.fieldnames = [h.strip().lower().replace("\ufeff", "") for h in reader.fieldnames]

    print("Wykryte nagłówki:", reader.fieldnames)

    for row in reader:
        code = row["title"].strip()
        loc_code = row["location"].strip()
        description = row["buckettype"].strip() if row["buckettype"] else None
        comment = row["comment"].strip() if row["comment"] else None

        # Zamiana kodu lokalizacji na ID
        location_id = location_map.get(loc_code)

        if location_id is None:
            print(f"❌ Błąd: lokalizacja '{loc_code}' nie istnieje w bazie! Pomijam {code}.")
            continue

        payload = {
            "code": code,
            "description": description,
            "comment": comment,
            "location_id": location_id,
            "status": "unknown"
        }

        r = requests.post(f"{API_URL}/containers/", json=payload, headers=headers)

        if r.status_code == 200:
            print(f"✔ Dodano kontener: {code}")
        else:
            print(f"❌ Błąd przy {code}: {r.status_code} {r.text}")
