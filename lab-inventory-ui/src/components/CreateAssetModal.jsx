import { useState } from "react";
import { API_BASE } from "../api/axios";

const NORMALIZE = (type) => (type === "Motherboard" ? "MOBO" : type);

export default function CreateAssetModal({ assets, onClose, onCreated }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    tag: "", name: "", type: "", platform: "",
    manufacturer: "", model: "", socket: "", generation: "",
    memory_size: "", memory_type: "",
    cores: "", threads: "", base_clock: "", memory_clock: "", score: "",
    status: "", comment: "",
  });

  const [error, setError]       = useState("");
  const [submitting, setSubmit] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Show auto-tag option only when type + Desktop platform both filled
  const showNextTag = form.type.trim() !== "" && form.platform === "Desktop";

  const applyNextTag = () => {
    const prefix = NORMALIZE(form.type.trim());
    const tag_prefix = prefix + "-";

    const nums = assets
      .filter((a) => {
        const aType = NORMALIZE(a.type || "");
        return (
          aType.toLowerCase() === prefix.toLowerCase() &&
          a.platform === "Desktop"
        );
      })
      .map((a) => a.tag || "")
      .filter((t) => t.toUpperCase().startsWith(tag_prefix.toUpperCase()))
      .map((t) => parseInt(t.slice(tag_prefix.length), 10))
      .filter((n) => !isNaN(n));

    const next = nums.length ? Math.max(...nums) + 1 : 1;
    set("tag", `${prefix}-${next}`);
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

      onCreated();
      onClose();
    } catch {
      setError("Błąd połączenia z serwerem");
      setSubmit(false);
    }
  };

  // Suggestions from existing data
  const uniq = (fn) =>
    [...new Set(assets.map(fn).filter(Boolean))].sort();

  const names = uniq((a) => a.name);

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
                  title="Wypełnij kolejnym numerem dla tego typu i platformy Desktop"
                >
                  Użyj następnego numeru
                </button>
              )}
            </div>
          </div>

          <div className="modal-grid">
            <div className="form-row">
              <label>Nazwa</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                list="cam-names"
              />
              <datalist id="cam-names">
                {names.map((n) => <option key={n} value={n} />)}
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
