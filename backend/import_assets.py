import csv
import requests

API_URL = "http://10.19.148.12:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NTgzMDk4Mn0.an2IFn6L0H1PvW98V90P742Np4zQ04_7lvDlBcST308"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

def clean_number(value):
    if not value:
        return None
    value = value.replace(",", ".")
    try:
        return float(value)
    except:
        return None

def clean_text(value):
    if not value:
        return None
    value = value.strip()
    value = value.replace('"', "")
    value = value.replace("[", "")
    value = value.replace("]", "")
    return value or None

print("Pobieram lokalizacje...")
loc_res = requests.get(f"{API_URL}/locations/")
locations = loc_res.json()
location_map = {loc["code"]: loc["id"] for loc in locations}

print("Pobieram kontenery...")
cont_res = requests.get(f"{API_URL}/containers/")
containers = cont_res.json()
container_map = {c["code"]: c["id"] for c in containers}

with open("assets.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    # Normalizacja nagłówków
    reader.fieldnames = [
        h.strip().lower()
         .replace("\ufeff", "")
         .replace('"', "")
        for h in reader.fieldnames
    ]

    print("Wykryte nagłówki:", reader.fieldnames)

    for row in reader:
        tag = clean_text(row.get("ain"))
        name = clean_text(row.get("item"))

        if not tag or not name:
            print(f"❌ Pomijam wiersz bez tagu lub nazwy: {row}")
            continue

        manufacturer = clean_text(row.get("oem"))
        model = clean_text(row.get("chipset"))
        type_ = clean_text(row.get("item_type"))
        platform = clean_text(row.get("platform"))

        container_code = clean_text(row.get("group"))
        location_code = clean_text(row.get("group: location"))

        socket = clean_text(row.get("socket"))
        cores = int(row["cores"]) if row.get("cores") else None
        threads = int(row["threads"]) if row.get("threads") else None

        base_clock = clean_number(row.get("base_clock"))
        memory_clock = clean_number(row.get("memory clock"))
        score = clean_number(row.get("score"))

        generation = clean_text(row.get("generation"))
        memory_size = clean_text(row.get("memory_size"))
        memory_type = clean_text(row.get("memory_type"))

        # 🔥 MAPOWANIE AVAILABLE → STATUS
        available_raw = clean_text(row.get("available"))
        status = "available" if available_raw and available_raw.lower() == "true" else "unknown"

        comment = clean_text(row.get("comment"))

        location_id = location_map.get(location_code) if location_code else None
        container_id = container_map.get(container_code) if container_code else None

        payload = {
            "tag": tag,
            "name": name,
            "type": type_,
            "model": model,
            "serial": None,
            "manufacturer": manufacturer,
            "notes": None,
            "comment": comment,
            "platform": platform,
            "socket": socket,
            "cores": cores,
            "threads": threads,
            "base_clock": base_clock,
            "memory_clock": memory_clock,
            "generation": generation,
            "memory_size": memory_size,
            "memory_type": memory_type,
            "score": score,
            "status": status,          # 🔥 JEDYNE pole statusu wysyłane do backendu
            "location_id": location_id,
            "container_id": container_id
        }

        # 🔥 NIE WYSYŁAMY available — backend by wywalił błąd

        r = requests.post(f"{API_URL}/assets/", json=payload, headers=headers)

        if r.status_code == 200:
            print(f"✔ Dodano asset: {tag}")
        else:
            print(f"❌ Błąd przy {tag}: {r.status_code} {r.text}")
