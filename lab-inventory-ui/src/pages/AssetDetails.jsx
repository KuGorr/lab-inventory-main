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
    fetch(`${API_BASE}/assets/${id}/history?page=${pageNum}`)
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

  if (!asset) return <div>Ładowanie...</div>;

  // compat and above can edit status/comment and move assets
  const canEdit =
    user.role === "compat" ||
    user.role === "manager" ||
    user.role === "admin";

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
          <h2>Specyfikacja</h2>
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
              <tr><td>Dostępny:</td><td>{asset.available ? "Tak" : "Nie"}</td></tr>
            </tbody>
          </table>

          <h2>Komentarz</h2>
          <p>{asset.comment?.trim() || "Brak komentarza"}</p>

          {canEdit && (
            <div className="form-row">
              <h3>Edytuj komentarz</h3>
              <textarea
                value={asset.comment || ""}
                onChange={(e) => setAsset({ ...asset, comment: e.target.value })}
                rows={3}
              />
              <br />
              <button onClick={saveComment}>Zapisz komentarz</button>
            </div>
          )}

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
              <Link to={`/assets/${id}/move`}>
                <button>Przenieś asset</button>
              </Link>
            )}
            {user.role === "admin" && (
              <button onClick={deleteAsset} className="btn-danger">
                Usuń asset
              </button>
            )}
          </div>
        </div>

        {/* PRAWA KOLUMNA — HISTORIA */}
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
                      {h.old_location_name || "-"} → {h.new_location_name || "-"}
                      <br />
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
        </div>
      </div>
    </div>
  );
}
