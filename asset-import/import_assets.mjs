console.log(">>> TO JEST TEN PLIK, KTÓRY SIĘ WYKONUJE <<<");

import fs from "fs";
import { parse } from "csv-parse/sync";
import fetch from "node-fetch";

// 🔧 KONFIG
const API_BASE = "http://10.19.148.12:8000";
const CSV_PATH = "../backend/assets.csv";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3NTA0NDI0OH0.qfFmpaW9umfop_sfNnvgMkEww6CQWxn8GhFkqJDEgqg";

// 🔧 Pliki logów
const errorLog = fs.createWriteStream("import_errors.txt", { flags: "w" });
const successLog = fs.createWriteStream("import_success.txt", { flags: "w" });

// 🔧 Zamiana na liczbę (obsługuje "4,000", "1,750", "16,907")
function toNumber(v) {
  if (!v) return null;
  const cleaned = v.toString().replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

// 🔧 Usuwanie ["DDR4"] → DDR4
function cleanListString(v) {
  if (!v) return null;
  return v
    .toString()
    .split("[")
    .join("")
    .split("]")
    .join("")
    .split('"')
    .join("")
    .trim();
}

// 🔧 Normalizacja pustych pól
function clean(v) {
  if (v === undefined || v === null) return null;
  const trimmed = v.toString().trim();
  if (trimmed === "" || trimmed === "--") return null;
  return trimmed;
}

// 🔧 Rozpoznawanie lokalizacji (tylko X.Y)
function isLocationCode(code) {
  if (!code) return false;
  return /^[0-9]+\.[0-9]+/.test(code);
}

async function main() {
  // 1. Wczytaj CSV
  const csvRaw = fs.readFileSync(CSV_PATH, "utf-8");
  const records = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log("Wczytano rekordów z CSV:", records.length);

  // 2. Pobierz lokalizacje i kontenery
  const locations = await fetch(`${API_BASE}/locations/`).then((r) => r.json());
  const containers = await fetch(`${API_BASE}/containers/`).then((r) => r.json());

  console.log("Lokalizacje:", locations.length, "Kontenery:", containers.length);

  let ok = 0;
  let fail = 0;

  for (const a of records) {
    try {
      const locCodeRaw = clean(a["Group: Location"]);
      const groupCodeRaw = clean(a["Group"]);

      let loc = null;
      let cont = null;

      // 1) Najpierw próbujemy użyć Group: Location
      if (locCodeRaw && isLocationCode(locCodeRaw)) {
        const lc = locCodeRaw.toLowerCase();
        loc = locations.find((l) => l.code.toLowerCase() === lc) || null;
      }

      // 2) Jeśli brak lokalizacji, a Group wygląda jak lokalizacja → użyj Group jako lokalizacji
      if (!loc && groupCodeRaw && isLocationCode(groupCodeRaw)) {
        const gc = groupCodeRaw.toLowerCase();
        loc = locations.find((l) => l.code.toLowerCase() === gc) || null;
      }

      // 3) Jeśli nadal brak lokalizacji → pomijamy rekord
      if (!loc) {
        const msg = `Brak lokalizacji: ${locCodeRaw || groupCodeRaw || "(pusto)"} dla ${a.AIN} ${a.Item}\n`;
        console.warn("❗", msg.trim());
        errorLog.write(msg);
        fail++;
        continue;
      }

      // 4) Kontener: tylko jeśli Group NIE jest lokalizacją
      if (groupCodeRaw && !isLocationCode(groupCodeRaw)) {
        const gc = groupCodeRaw.toLowerCase();
        cont = containers.find((c) => c.code.toLowerCase() === gc) || null;

        if (!cont) {
          const msg = `Brak kontenera (opcjonalne): ${groupCodeRaw} dla ${a.AIN} ${a.Item}\n`;
          console.warn("❗", msg.trim());
          errorLog.write(msg);
        }
      }

      // 🔧 Budowanie obiektu Asset zgodnie z backendem
      const body = {
        tag: clean(a.AIN),
        name: clean(a.Item),
        type: clean(a.Item_Type),
        model: clean(a.Chipset),
        manufacturer: clean(a.OEM),
        notes: clean(a.Comment),

        platform: clean(a.Platform),
        socket: cleanListString(a.Socket),
        cores: toNumber(a.Cores),
        threads: toNumber(a.Threads),
        base_clock: toNumber(a.Base_Clock),
        memory_clock: toNumber(a["Memory Clock"]),
        generation: clean(a.Generation),
        memory_size: clean(a.Memory_Size),
        memory_type: cleanListString(a.Memory_Type),
        score: toNumber(a.Score),
        available: (a.Available || "").toString().toLowerCase() === "true",

        location_id: loc.id,
        container_id: cont ? cont.id : null,
      };

      const res = await fetch(`${API_BASE}/assets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        const msg = `Błąd API: ${a.AIN} ${a.Item} → ${res.status} ${text}\n`;
        console.error("❌", msg.trim());
        errorLog.write(msg);
        fail++;
      } else {
        const msg = `Dodano: ${a.AIN} ${a.Item}\n`;
        console.log("✅", msg.trim());
        successLog.write(msg);
        ok++;
      }
    } catch (err) {
      const msg = `Fatalny błąd: ${a.AIN} ${a.Item} → ${err}\n`;
      console.error("💥", msg.trim());
      errorLog.write(msg);
      fail++;
    }
  }

  console.log("Gotowe. OK:", ok, "Błędy:", fail);
  errorLog.end();
  successLog.end();
}

main().catch((e) => {
  console.error("Fatal error:", e);
});
