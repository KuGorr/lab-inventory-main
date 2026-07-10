import { useState } from "react";
import { API_BASE } from "../api/axios";

const NORMALIZE = (type) => (type === "Motherboard" ? "MBR" : type);

const DRAFT_KEY = "create_asset_draft";

const EMPTY_FORM = {
  tag: "", name: "", type: "", platform: "",
  manufacturer: "", model: "", socket: "", generation: "",
  memory_size: "", memory_type: "",
  cores: "", threads: "", base_clock: "", memory_clock: "", score: "",
  status: "", comment: "",
};

const readDraft = () => {
  try {
    const v = localStorage.getItem(DRAFT_KEY);
    return v ? { ...EMPTY_FORM, ...JSON.parse(v) } : EMPTY_FORM;
  } catch { return EMPTY_FORM; }
};

export default function CreateAssetModal({ assets, onClose, onCreated }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState(readDraft);
  const [hasDraft]      = useState(() => !!localStorage.getItem(DRAFT_KEY));
  const [error, setError]       = useState("");
  const [submitting, setSubmit] = useState(false);

  const [searching, setSearching] = useState(false);

  const set = (field, value) => setForm((f) => {
    const next = { ...f, [field]: value };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    return next;
  });

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(EMPTY_FORM);
  };

  // 🔥 Auto‑tag działa zawsze — niezależnie od platformy
  const showNextTag = form.type.trim() !== "";

  const applyNextTag = () => {
    const rawType = form.type.trim();
    const prefix = NORMALIZE(rawType).toUpperCase();

    const numbers = assets
      .filter((a) => NORMALIZE(a.type || "").toUpperCase() === prefix)
      .map((a) => (a.tag || "").toUpperCase())
      .map((t) => {
        // CPU: CPU-001 (numerowane), CPU-CLL-xxx (ignorowane)
        if (prefix === "CPU") {
          const m = t.match(/^CPU-(\d{1,3})$/i);
          return m ? parseInt(m[1], 10) : null;
        }

        // GPU: GPU-001 (numerowane), GPU-CLL-xxx (ignorowane)
        if (prefix === "GPU") {
          const m = t.match(/^GPU-(\d{1,3})$/i);
          return m ? parseInt(m[1], 10) : null;
        }

        // MBR: MBR-001 (numerowane), MBR-CLL-xxx (ignorowane)
        if (prefix === "MBR") {
          const m = t.match(/^MBR-(\d{1,3})$/i);
          return m ? parseInt(m[1], 10) : null;
        }

        return null;
      })
      .filter((n) => n !== null);

    const next = numbers.length ? Math.max(...numbers) + 1 : 1;

    // GPU + MBR mają format z zerami
    if (prefix === "GPU" || prefix === "MBR") {
      const padded = String(next).padStart(3, "0");
      set("tag", `${prefix}-${padded}`);
      return;
    }

    // CPU ma format bez zer
    set("tag", `${prefix}-${next}`);
  };




  // 🔍 WYSZUKIWANIE ASSETU W BAZIE I AUTOFILL
  const searchAssetInDatabase = async () => {
    if (!form.name.trim()) return;

    setSearching(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/assets/search-by-name?name=${encodeURIComponent(form.name)}`
      );

      const data = await res.json();

      if (!data.found) {
        setError("Nie znaleziono podobnego assetu w bazie.");
        setSearching(false);
        return;
      }

      const a = data.asset;

      // 🔥 AUTOMATYCZNE UZUPEŁNIANIE PÓL — zgodne z tabelą PostgreSQL
      setForm((f) => {
        const next = {
          ...f,

          model: a.model || "",
          manufacturer: a.manufacturer || "",
          type: a.type || "",
          platform: a.platform || "",

          base_clock: a.base_clock || "",
          memory_clock: a.memory_clock || "",

          memory_size: a.memory_size || "",
          memory_type: a.memory_type || "",

          cores: a.cores || "",
          threads: a.threads || "",
          socket: a.socket || "",
          generation: a.generation || "",

          score: a.score || "",

          // komentarz NIE jest kopiowany
          comment: f.comment,
        };

        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        return next;
      });

    } catch (err) {
      setError("Błąd wyszukiwania assetu.");
    }

    setSearching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmit(true);

    const payload = { ...form };

    // Numeric coercion
    for (const f of ["cores", "threads"]) {
      payload[f] = form[f] !== "" ? parseInt(form[f], 10) : null;
    }
    for (const f of ["base_clock", "memory_clock", "score"]) {
      payload[f] = form[f] !== "" ? parseFloat(form[f]) : null;
    }
    // Empty strings → null
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") payload[key] = null;
    }

    try {
      const res = await fetch(`${API_BASE}/assets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Błąd tworzenia assetu");
        setSubmit(false);
        return;
      }

      localStorage.removeItem(DRAFT_KEY);
      onCreated();
      onClose();
    } catch {
      setError("Błąd połączenia z serwerem");
      setSubmit(false);
    }
  };

  const names = [...new Set(assets.map((a) => a.name).filter(Boolean))].sort();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nowy asset</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {hasDraft && (
            <div className="draft-notice">
              Wczytano niezapisany szkic.{" "}
              <button type="button" className="draft-clear" onClick={clearDraft}>
                Wyczyść
              </button>
            </div>
          )}

          {/* TAG — with optional auto-number */}
          <div className="form-row">
            <label>Tag *</label>
            <div className="modal-tag-row">
              <input
                required
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="np. CPU-201"
              />
              {showNextTag && (
                <button
                  type="button"
                  className="btn-secondary modal-next-tag-btn"
                  onClick={applyNextTag}
                >
                  Użyj następnego numeru
                </button>
              )}
            </div>
          </div>

          <div className="modal-grid">

            {/* 🔍 Nazwa + wyszukiwanie */}
            <div className="form-row">
              <label>Nazwa</label>

              <div className="modal-name-row">
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="np. MSI GeForce RTX 3070 Ti VENTUS 3X OC"
                  list="cam-names"
                />

                <button
                  type="button"
                  className="btn-secondary modal-search-btn"
                  disabled={!form.name.trim() || searching}
                  onClick={searchAssetInDatabase}
                >
                  {searching ? "..." : "🔍"}
                </button>
              </div>

              <datalist id="cam-names">
                {names.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>

            <div className="form-row">
              <label>Typ</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">— wybierz —</option>
                <option value="CPU">CPU</option>
                <option value="Motherboard">Motherboard</option>
                <option value="GPU">GPU</option>
              </select>
            </div>

            <div className="form-row">
              <label>Platforma</label>
              <select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
                <option value="">— wybierz —</option>
                <option value="Desktop">Desktop</option>
                <option value="Laptop">Laptop</option>
                <option value="Handheld">Handheld</option>
              </select>
            </div>

            <div className="form-row">
              <label>Producent (OEM)</label>
              <input
                value={form.manufacturer}
                onChange={(e) => set("manufacturer", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Model</label>
              <input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Socket</label>
              <input
                value={form.socket}
                onChange={(e) => set("socket", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Generacja</label>
              <input
                value={form.generation}
                onChange={(e) => set("generation", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>RAM Size</label>
              <input
                value={form.memory_size}
                onChange={(e) => set("memory_size", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>RAM Type</label>
              <input
                value={form.memory_type}
                onChange={(e) => set("memory_type", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Rdzenie</label>
              <input
                type="number"
                min="0"
                value={form.cores}
                onChange={(e) => set("cores", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Wątki</label>
              <input
                type="number"
                min="0"
                value={form.threads}
                onChange={(e) => set("threads", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Base Clock (GHz)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.base_clock}
                onChange={(e) => set("base_clock", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Memory Clock</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.memory_clock}
                onChange={(e) => set("memory_clock", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Score</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.score}
                onChange={(e) => set("score", e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="">— brak —</option>
                <option value="available">✅ Dostępny</option>
                <option value="borrowed">🔄 Wypożyczony</option>
                <option value="broken">🗑️ Uszkodzony</option>
                <option value="lost">❓ Zagubiony</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label>Komentarz</label>
            <textarea
              value={form.comment}
              onChange={(e) => set("comment", e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="msg-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Tworzenie…" : "Utwórz asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
