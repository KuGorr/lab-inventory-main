import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

/* ------------------------------
   STATUS SELECTOR (NAPRAWIONY)
------------------------------ */
const StatusSelector = ({ value, onChange, disabled }) => {
  // Normalizacja wartości z backendu
  const normalized =
    value === null || value === "null" || value === undefined || value === ""
      ? "none"
      : value;

  const options = [
    { key: "none", icon: "◻️?", label: "Brak statusu", color: "#777" },
    { key: "available", icon: "✅", label: "Dostępny", color: "#4CAF50" },
    { key: "borrowed", icon: "🔄", label: "Pożyczony", color: "#2196F3" },
    { key: "broken", icon: "🗑️", label: "Zepsuty", color: "#F44336" },
    { key: "lost", icon: "❓", label: "Zaginiony", color: "#9C27B0" },
  ];

  return (
    <div className="status-selector">
      {options.map((o) => {
        const active = normalized === o.key;
        const classes = [
          active ? "active" : "",
          active ? `active-${o.key}` : "",
          disabled ? "disabled" : "",
        ].filter(Boolean).join(" ");

        return (
          <button
            key={o.key}
            onClick={() => !disabled && onChange(o.key)}
            className={classes}
            title={o.label}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
};

export default function ContainerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [container, setContainer] = useState(null);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const loadContainer = useCallback(() => {
    // fetch(`http://10.19.148.12:8000/containers/${id}`)
    fetch(`http://localhost:8000/containers/${id}`)
      .then((res) => {
        if (res.status === 404) {
          navigate("/containers");
          return null;
        }
        return res.json();
      })
      .then((data) => data && setContainer(data));
  }, [id, navigate]);

  const loadHistory = useCallback((pageNum = 1) => {
    // fetch(`http://10.19.148.12:8000/containers/${id}/history?page=${pageNum}`)
    fetch(`http://localhost:8000/containers/${id}/history?page=${pageNum}`)
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

  // 🔥 REALTIME WEBSOCKET
  useEffect(() => {
    // const ws = new WebSocket("ws://10.19.148.12:8000/ws/containers");
    const ws = new WebSocket("ws://localhost:8000/ws/containers");

    ws.onmessage = (event) => {
      if (event.data === "containers_updated") {
        loadContainer();
        loadHistory(historyPage);
      }
    };

    return () => ws.close();
  }, [loadContainer, loadHistory, historyPage]);

  if (!container) return <div>Ładowanie...</div>;

  const canEdit =
    user.role === "compat" ||
    user.role === "manager" ||
    user.role === "admin";

  // -----------------------------
  // DELETE CONTAINER (admin only)
  // -----------------------------
  const deleteContainer = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten kontener?")) return;

    // const res = await fetch(`http://10.19.148.12:8000/containers/${id}`, {
    const res = await fetch(`http://localhost:8000/containers/${id}`, {
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

  // -----------------------------
  // UPDATE COMMENT (compat+)
  // -----------------------------
  const saveComment = async () => {
    // await fetch(`http://10.19.148.12:8000/containers/${id}/comment`, {
    await fetch(`http://localhost:8000/containers/${id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comment: container.comment || "" }),
    });
  };

  // -----------------------------
  // UPDATE STATUS (NAPRAWIONE)
  // -----------------------------
  const updateStatus = async (newStatus) => {
    const backendValue = newStatus === "none" ? null : newStatus;

    // await fetch(`http://10.19.148.12:8000/containers/${id}/status`, {
    await fetch(`http://localhost:8000/containers/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: backendValue }),
    });

    setContainer({ ...container, status: backendValue });
  };

  return (
    <div className="page">
      {/* NAGŁÓWEK + STATUS */}
      <div className="details-header">
        <h1>Kontener: {container.code}</h1>

        <StatusSelector
          value={container.status}
          disabled={!canEdit}
          onChange={updateStatus}
        />
      </div>

      <Link to="/containers" className="back-link">← Kontenery</Link>

      {error && (
        <p className="msg-error">
          {error}
        </p>
      )}

      {/* DWIE KOLUMNY */}
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
                onChange={(e) =>
                  setContainer({ ...container, comment: e.target.value })
                }
                rows={3}
              />
              <br />
              <button onClick={saveComment}>Zapisz komentarz</button>
            </div>
          )}

          <p>
            Lokalizacja:{" "}
            {container.location ? (
              <Link to={`/locations/${container.location.id}`}>
                {container.location.code}
              </Link>
            ) : (
              "-"
            )}
          </p>

          <div className="btn-row">
            {canEdit && (
              <Link to={`/containers/${id}/move`}>
                <button>Przenieś kontener</button>
              </Link>
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
                    <td>
                      <Link to={`/assets/${a.id}`}>{a.tag}</Link>
                    </td>
                    <td>{a.name}</td>
                    <td>{a.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      <strong>
                        {new Date(h.moved_at).toLocaleString()}
                      </strong>
                      <br />
                      {(h.old_location_name || "-")} →{" "}
                      {(h.new_location_name || "-")}
                      <br />
                      {h.note?.trim() || "brak notatki"}
                      <br />
                      <em className="meta-dim">
                        przeniósł: {h.moved_by || "nieznany"}
                      </em>
                    </li>
                  ))}
                </ul>

                {/* PAGINACJA */}
                <div className="pagination">
                  {Array.from({ length: historyPages }, (_, i) => i + 1).map(
                    (num) => (
                      <button
                        key={num}
                        onClick={() => loadHistory(num)}
                        className={num === historyPage ? "active" : ""}
                      >
                        {num}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
