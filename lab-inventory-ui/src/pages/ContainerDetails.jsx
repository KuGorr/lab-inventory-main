import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import StatusSelector from "../components/StatusSelector";
import { API_BASE, WS_BASE } from "../api/axios";

export default function ContainerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [container, setContainer] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);

  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // MODAL MOVE STATE
  const [showMove, setShowMove] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");
  const [moveNote, setMoveNote] = useState("");
  const [moveError, setMoveError] = useState("");

  const [locations, setLocations] = useState([]);
  const [containers, setContainers] = useState([]);

  const loadContainer = useCallback(() => {
    fetch(`${API_BASE}/containers/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/containers"); return null; }
        return res.json();
      })
      .then((data) => data && setContainer(data));
  }, [id, navigate]);

  const loadHistory = useCallback((pageNum = 1) => {
    fetch(`${API_BASE}/containers/${id}/history?page=${pageNum}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.items);
        setHistoryPages(data.pages);
        setHistoryPage(data.page);
      });
  }, [id]);

  useEffect(() => {
    loadContainer();
    loadHistory(1);
  }, [loadContainer, loadHistory]);

  // WS auto-refresh
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/containers`);

    ws.onerror = () => {};
    ws.onmessage = (event) => {
      if (event.data === "containers_updated") {
        loadContainer();
        loadHistory(historyPage);
      }
    };

    return () => ws.close();
  }, [loadContainer, loadHistory, historyPage]);

  // Load locations/containers when modal opens
  useEffect(() => {
    if (!showMove) return;
    fetch(`${API_BASE}/locations/`).then((r) => r.json()).then(setLocations);
    fetch(`${API_BASE}/containers/`).then((r) => r.json()).then(setContainers);
  }, [showMove]);

  if (!container) return <div>Ładowanie...</div>;

  const canEdit =
    user.role === "compat" ||
    user.role === "manager" ||
    user.role === "admin";

  // DELETE
  const deleteContainer = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten kontener?")) return;

    const res = await fetch(`${API_BASE}/containers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Nie udało się usunąć kontenera");
      return;
    }

    navigate("/containers");
  };

  // COMMENT
  const saveComment = async () => {
    await fetch(`${API_BASE}/containers/${id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comment: container.comment || "" }),
    });
  };

  // STATUS
  const updateStatus = async (newStatus) => {
    const backendValue = newStatus === "none" ? null : newStatus;

    await fetch(`${API_BASE}/containers/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: backendValue }),
    });

    setContainer({ ...container, status: backendValue });
  };

  // MOVE CONTAINER (modal)
  const submitMove = async (e) => {
    e.preventDefault();
    setMoveError("");

    const res = await fetch(`${API_BASE}/containers/${id}/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ target: moveTarget, note: moveNote }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMoveError(data.detail || "Błąd przenoszenia kontenera");
      return;
    }

    setShowMove(false);
    setMoveTarget("");
    setMoveNote("");

    loadContainer();
    loadHistory(1);
  };

  return (
    <div className="page">
      <div className="details-header">
        <h1>Kontener: {container.code}</h1>
        <StatusSelector value={container.status} disabled={!canEdit} onChange={updateStatus} />
      </div>

      <Link to="/containers" className="back-link">← Kontenery</Link>

      {error && <p className="msg-error">{error}</p>}

      <div className="details-grid">
        {/* LEWA KOLUMNA */}
        <div>
          <h2>Informacje</h2>
          <p>Kod: {container.code}</p>
          <p>Opis: {container.description}</p>

          <h2>Komentarz</h2>
          <p>{container.comment?.trim() || "Brak komentarza"}</p>

          {canEdit && (
            <div className="form-row">
              <h3>Edytuj komentarz</h3>
              <textarea
                value={container.comment || ""}
                onChange={(e) => setContainer({ ...container, comment: e.target.value })}
                rows={3}
              />
              <br />
              <button onClick={saveComment}>Zapisz komentarz</button>
            </div>
          )}

          <p>
            Lokalizacja:{" "}
            {container.location ? (
              <Link to={`/locations/${container.location.id}`}>{container.location.code}</Link>
            ) : "-"}
          </p>

          <div className="btn-row">
            {canEdit && (
              <button onClick={() => setShowMove(true)}>Przenieś kontener</button>
            )}
            {user.role === "admin" && (
              <button onClick={deleteContainer} className="btn-danger">
                Usuń kontener
              </button>
            )}
          </div>

          <h2>Assety w kontenerze</h2>

          {container.assets.length === 0 && <p>Brak assetów.</p>}

          {container.assets.length > 0 && (
            <div className="table-scroll-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Nazwa</th>
                    <th>Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {container.assets.map((a) => (
                    <tr key={a.id}>
                      <td><Link to={`/assets/${a.id}`}>{a.tag}</Link></td>
                      <td>{a.name}</td>
                      <td>{a.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PRAWA KOLUMNA — HISTORIA */}
        <div>
          <h2>Historia ruchów kontenera</h2>

          <div className="history-timeline">
            {history.length === 0 && <p>Brak historii.</p>}

            {history.length > 0 && (
              <>
                <ul>
                  {history.map((h) => (
                    <li key={h.id} className="history-item">
                      <strong>{new Date(h.moved_at).toLocaleString()}</strong>
                      <br />
                      {h.old_location_name || "-"} → {h.new_location_name || "-"}
                      <br />
                      {h.note?.trim() || "brak notatki"}
                      <br />
                      <em className="meta-dim">przeniósł: {h.moved_by || "nieznany"}</em>
                    </li>
                  ))}
                </ul>

                <div className="pagination">
                  {Array.from({ length: historyPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => loadHistory(num)}
                      className={num === historyPage ? "active" : ""}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL MOVE */}
      {showMove && (
        <div className="modal-overlay" onClick={() => setShowMove(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Przenieś kontener</h2>
              <button type="button" className="modal-close" onClick={() => setShowMove(false)}>×</button>
            </div>

            <form onSubmit={submitMove} className="modal-form">
              <table className="info-table move-modal-current">
                <tbody>
                  <tr>
                    <td>Aktualna lokalizacja:</td>
                    <td>{container.location ? container.location.code : "-"}</td>
                  </tr>
                  <tr>
                    <td>Liczba assetów:</td>
                    <td>{container.assets.length}</td>
                  </tr>
                </tbody>
              </table>

              <div className="form-row">
                <label>Nowa lokalizacja:</label>
                <input
                  list="move-targets"
                  value={moveTarget}
                  onChange={(e) => setMoveTarget(e.target.value)}
                  placeholder="np. 9.3"
                  required
                />
                <datalist id="move-targets">
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.code}>{loc.code} — {loc.description}</option>
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
  );
}
