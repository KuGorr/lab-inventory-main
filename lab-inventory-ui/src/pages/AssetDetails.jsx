import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import StatusSelector from "../components/StatusSelector";
import { API_BASE, WS_BASE } from "../api/axios";

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editingSpec, setEditingSpec] = useState(false);
  const [specForm, setSpecForm] = useState({});
  const [specError, setSpecError] = useState("");

  const [showMove, setShowMove]     = useState(false);
  const [moveTarget, setMoveTarget] = useState("");
  const [moveNote, setMoveNote]     = useState("");
  const [moveError, setMoveError]   = useState("");
  const [locations, setLocations]   = useState([]);
  const [containers, setContainers] = useState([]);

  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const loadAsset = useCallback(() => {
    fetch(`${API_BASE}/assets/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/"); return null; }
        return res.json();
      })
      .then((data) => data && setAsset(data));
  }, [id, navigate]);

  const loadHistory = useCallback((pageNum = 1) => {
    fetch(`${API_BASE}/assets/${id}/history?page=${pageNum}&limit=3`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.items);
        setPages(data.pages);
        setPage(data.page);
      });
  }, [id]);

  useEffect(() => {
    loadAsset();
    loadHistory(1);
  }, [id, loadAsset, loadHistory]);

  // Reload if another user edits this asset while it's open
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/assets`);

    ws.onerror = () => {};
    ws.onmessage = (event) => {
      if (event.data === "assets_updated") {
        loadAsset();
        loadHistory(page);
      }
    };

    return () => ws.close();
  }, [id, page, loadAsset, loadHistory]);

  // Load locations/containers lazily when move modal opens
  useEffect(() => {
    if (!showMove) return;
    fetch(`${API_BASE}/locations/`).then((r) => r.json()).then(setLocations);
    fetch(`${API_BASE}/containers/`).then((r) => r.json()).then(setContainers);
  }, [showMove]);

  if (!asset) return <div>Ładowanie...</div>;

  // compat and above can edit status/comment and move assets
  const canEdit =
    user.role === "compat" ||
    user.role === "manager" ||
    user.role === "admin";

  // -----------------------------
  // Spec edit
  // -----------------------------
  const startEditSpec = () => {
    setSpecForm({
      name:        asset.name        ?? "",
      type:        asset.type        ?? "",
      model:       asset.model       ?? "",
      manufacturer:asset.manufacturer ?? "",
      platform:    asset.platform    ?? "",
      socket:      asset.socket      ?? "",
      generation:  asset.generation  ?? "",
      memory_size: asset.memory_size ?? "",
      memory_type: asset.memory_type ?? "",
      cores:       asset.cores       ?? "",
      threads:     asset.threads     ?? "",
      base_clock:  asset.base_clock  ?? "",
      memory_clock:asset.memory_clock ?? "",
      score:       asset.score       ?? "",
    });
    setSpecError("");
    setEditingSpec(true);
  };

  const cancelEditSpec = () => setEditingSpec(false);

  const saveSpec = async () => {
    setSpecError("");
    const payload = { ...specForm };
    for (const f of ["cores", "threads"]) {
      payload[f] = payload[f] !== "" ? parseInt(payload[f], 10) : null;
    }
    for (const f of ["base_clock", "memory_clock", "score"]) {
      payload[f] = payload[f] !== "" ? parseFloat(payload[f]) : null;
    }
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") payload[key] = null;
    }

    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setSpecError(data.detail || "Błąd zapisu");
      return;
    }

    const updated = await res.json();
    setAsset((prev) => ({ ...prev, ...updated }));
    setEditingSpec(false);
  };

  const setSpec = (field, value) =>
    setSpecForm((f) => ({ ...f, [field]: value }));

  // -----------------------------
  // Move asset modal
  // -----------------------------
  const submitMove = async (e) => {
    e.preventDefault();
    setMoveError("");

    const res = await fetch(`${API_BASE}/assets/${id}/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ target: moveTarget, note: moveNote }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMoveError(data.detail || "Błąd przenoszenia assetu");
      return;
    }

    setShowMove(false);
    setMoveTarget("");
    setMoveNote("");
    loadAsset();
    loadHistory(1);
  };

  // -----------------------------
  // Delete asset
  // -----------------------------
  const deleteAsset = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten asset?")) return;

    await fetch(`${API_BASE}/assets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    navigate("/");
  };

  // -----------------------------
  // Save comment
  // -----------------------------
  const saveComment = async () => {
    await fetch(`${API_BASE}/assets/${id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comment: asset.comment || "" }),
    });
  };

  // -----------------------------
  // Update status
  // -----------------------------
  const updateStatus = async (newStatus) => {
    const backendValue = newStatus === "none" ? null : newStatus;

    await fetch(`${API_BASE}/assets/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: backendValue }),
    });

    setAsset({ ...asset, status: backendValue });
  };

  return (
    <div className="page">
      <div className="details-header">
        <h1>Szczegóły assetu: {asset.tag}</h1>
        <StatusSelector value={asset.status} disabled={!canEdit} onChange={updateStatus} />
      </div>

      <Link to="/" className="back-link">← Assety</Link>

      <div className="details-grid">
        {/* LEWA KOLUMNA */}
        <div>
          <div className="spec-header">
            <h2>Specyfikacja</h2>
            {canEdit && !editingSpec && (
              <button className="btn-secondary spec-edit-btn" onClick={startEditSpec}>
                Edytuj
              </button>
            )}
          </div>

          {!editingSpec ? (
            <table className="info-table">
              <tbody>
                <tr><td>Nazwa:</td><td>{asset.name}</td></tr>
                <tr><td>Typ:</td><td>{asset.type}</td></tr>
                <tr><td>Model:</td><td>{asset.model}</td></tr>
                <tr><td>Producent:</td><td>{asset.manufacturer}</td></tr>
                <tr><td>Platforma:</td><td>{asset.platform}</td></tr>
                <tr><td>Socket:</td><td>{asset.socket}</td></tr>
                <tr><td>Cores:</td><td>{asset.cores}</td></tr>
                <tr><td>Threads:</td><td>{asset.threads}</td></tr>
                <tr><td>Base Clock:</td><td>{asset.base_clock}</td></tr>
                <tr><td>Memory Clock:</td><td>{asset.memory_clock}</td></tr>
                <tr><td>Generation:</td><td>{asset.generation}</td></tr>
                <tr><td>Memory Size:</td><td>{asset.memory_size}</td></tr>
                <tr><td>Memory Type:</td><td>{asset.memory_type}</td></tr>
                <tr><td>Score:</td><td>{asset.score}</td></tr>
              </tbody>
            </table>
          ) : (
            <div className="spec-edit-form">
              <div className="modal-grid">
                <div className="form-row">
                  <label>Nazwa</label>
                  <input value={specForm.name} onChange={(e) => setSpec("name", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Typ</label>
                  <select value={specForm.type} onChange={(e) => setSpec("type", e.target.value)}>
                    <option value="">— brak —</option>
                    <option value="CPU">CPU</option>
                    <option value="Motherboard">Motherboard</option>
                    <option value="GPU">GPU</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Model</label>
                  <input value={specForm.model} onChange={(e) => setSpec("model", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Producent</label>
                  <input value={specForm.manufacturer} onChange={(e) => setSpec("manufacturer", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Platforma</label>
                  <select value={specForm.platform} onChange={(e) => setSpec("platform", e.target.value)}>
                    <option value="">— brak —</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Handheld">Handheld</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Socket</label>
                  <input value={specForm.socket} onChange={(e) => setSpec("socket", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Generacja</label>
                  <input value={specForm.generation} onChange={(e) => setSpec("generation", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Memory Size</label>
                  <input value={specForm.memory_size} onChange={(e) => setSpec("memory_size", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Memory Type</label>
                  <input value={specForm.memory_type} onChange={(e) => setSpec("memory_type", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Cores</label>
                  <input type="number" min="0" value={specForm.cores} onChange={(e) => setSpec("cores", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Threads</label>
                  <input type="number" min="0" value={specForm.threads} onChange={(e) => setSpec("threads", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Base Clock (GHz)</label>
                  <input type="number" step="0.001" min="0" value={specForm.base_clock} onChange={(e) => setSpec("base_clock", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Memory Clock</label>
                  <input type="number" step="0.001" min="0" value={specForm.memory_clock} onChange={(e) => setSpec("memory_clock", e.target.value)} />
                </div>
                <div className="form-row">
                  <label>Score</label>
                  <input type="number" step="0.01" min="0" value={specForm.score} onChange={(e) => setSpec("score", e.target.value)} />
                </div>
              </div>

              {specError && <div className="msg-error">{specError}</div>}

              <div className="btn-row">
                <button onClick={saveSpec}>Zapisz</button>
                <button className="btn-secondary" onClick={cancelEditSpec}>Anuluj</button>
              </div>
            </div>
          )}

          <h2>Komentarz</h2>
          <p>{asset.comment?.trim() || "Brak komentarza"}</p>

          {canEdit && (
            <div className="form-row comment-edit">
              <h3>Edytuj komentarz</h3>
              <textarea
                value={asset.comment || ""}
                onChange={(e) => setAsset({ ...asset, comment: e.target.value })}
                rows={3}
              />
              <div className="btn-row">
                <button onClick={saveComment}>Zapisz komentarz</button>
              </div>
            </div>
          )}

        </div>

        {/* PRAWA KOLUMNA — HISTORIA + LOKALIZACJA */}
        <div>
          <h2>Historia ruchów</h2>

          <div className="history-timeline">
            {history.length === 0 && <p>Brak historii.</p>}

            {history.length > 0 && (
              <>
                <ul>
                  {history.map((h) => (
                    <li key={h.id} className="history-item">
                      <strong>{new Date(h.moved_at).toLocaleString()}</strong>
                      <br />
                      {(h.old_location_name || h.new_location_name) && (
                        <>{h.old_location_name || "-"} → {h.new_location_name || "-"}<br /></>
                      )}
                      {h.note?.trim() || "brak notatki"}
                      <br />
                      <em className="meta-dim">przeniósł: {h.moved_by || "nieznany"}</em>
                    </li>
                  ))}
                </ul>

                <div className="pagination">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => loadHistory(num)}
                      className={num === page ? "active" : ""}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <h2>Lokalizacja</h2>
          <p>
            Lokalizacja:{" "}
            {asset.location ? (
              <Link to={`/locations/${asset.location.id}`}>{asset.location.code}</Link>
            ) : "-"}
            <br />
            Kontener:{" "}
            {asset.container ? (
              <Link to={`/containers/${asset.container.id}`}>{asset.container.code}</Link>
            ) : "-"}
          </p>

          <div className="btn-row">
            {canEdit && (
              <button onClick={() => setShowMove(true)}>Przenieś asset</button>
            )}
            {user.role === "admin" && (
              <button onClick={deleteAsset} className="btn-danger">Usuń asset</button>
            )}
          </div>

          {showMove && (
            <div className="modal-overlay" onClick={() => setShowMove(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Przenieś asset</h2>
                  <button type="button" className="modal-close" onClick={() => setShowMove(false)}>×</button>
                </div>

                <form onSubmit={submitMove} className="modal-form">
                  <table className="info-table move-modal-current">
                    <tbody>
                      <tr>
                        <td>Aktualna lokalizacja:</td>
                        <td>{asset.location ? asset.location.code : "-"}</td>
                      </tr>
                      <tr>
                        <td>Aktualny kontener:</td>
                        <td>{asset.container ? asset.container.code : "-"}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="form-row">
                    <label>Nowa lokalizacja lub kontener:</label>
                    <input
                      list="move-targets"
                      value={moveTarget}
                      onChange={(e) => setMoveTarget(e.target.value)}
                      placeholder="np. 9.3 lub CLA-022"
                      required
                    />
                    <datalist id="move-targets">
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.code}>{loc.code} — {loc.description}</option>
                      ))}
                      {containers.map((c) => (
                        <option key={c.id} value={c.code}>{c.code} — {c.description}</option>
                      ))}
                    </datalist>
                  </div>

                  <div className="form-row">
                    <label>Notatka:</label>
                    <textarea
                      value={moveNote}
                      onChange={(e) => setMoveNote(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {moveError && <div className="msg-error">{moveError}</div>}

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowMove(false)}>Anuluj</button>
                    <button type="submit">Przenieś</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
