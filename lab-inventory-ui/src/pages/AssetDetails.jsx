import { useEffect, useState } from "react";
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
    <div style={{ display: "flex", gap: "10px" }}>
      {options.map((o) => {
        const active = normalized === o.key;

        return (
          <button
            key={o.key}
            onClick={() => !disabled && onChange(o.key)}
            style={{
              padding: "8px 14px",
              border: active ? `3px solid ${o.color}` : "1px solid #ccc",
              background: active ? `${o.color}22` : "#fff",
              cursor: disabled ? "default" : "pointer",
              fontSize: "26px",
              borderRadius: "8px",
              opacity: disabled ? 0.5 : 1,
              transition: "0.15s ease",
              transform: active ? "scale(1.1)" : "scale(1.0)",
            }}
            title={o.label}
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
};

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);

  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const loadAsset = () => {
    fetch(`http://10.19.148.12:8000/assets/${id}`)
      .then((res) => {
        if (res.status === 404) {
          navigate("/assets");
          return null;
        }
        return res.json();
      })
      .then((data) => data && setAsset(data));
  };

  const loadHistory = (pageNum = 1) => {
    fetch(`http://10.19.148.12:8000/assets/${id}/history?page=${pageNum}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.items);
        setPages(data.pages);
        setPage(data.page);
      });
  };

  useEffect(() => {
    loadAsset();
    loadHistory(1);
  }, [id]);

  useEffect(() => {
    const ws = new WebSocket("ws://10.19.148.12:8000/ws/assets");

    ws.onmessage = (event) => {
      if (event.data === "assets_updated") {
        loadAsset();
        loadHistory(page);
      }
    };

    return () => ws.close();
  }, [id, page]);

  if (!asset) return <div>Ładowanie...</div>;

  const deleteAsset = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten asset?")) return;

    await fetch(`http://10.19.148.12:8000/assets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    navigate("/assets");
  };

  const saveComment = async () => {
    await fetch(`http://10.19.148.12:8000/assets/${id}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ comment: asset.comment || "" }),
    });
  };

  /* ------------------------------
     ZMIANA STATUSU
  ------------------------------ */
  const updateStatus = async (newStatus) => {
    const backendValue = newStatus === "none" ? null : newStatus;

    await fetch(`http://10.19.148.12:8000/assets/${id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: backendValue }),
    });

    setAsset({ ...asset, status: backendValue });
  };

  const canEdit =
    user.role === "compat" ||
    user.role === "manager" ||
    user.role === "admin";

  return (
    <div style={{ padding: "20px" }}>
      {/* NAGŁÓWEK + STATUS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Szczegóły assetu: {asset.tag}</h1>

        <StatusSelector
          value={asset.status}
          disabled={!canEdit}
          onChange={updateStatus}
        />
      </div>

      <Link to="/assets">← Powrót</Link>

      {/* DWIE KOLUMNY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginTop: "20px",
        }}
      >
        {/* LEWA KOLUMNA */}
        <div>
          <h2>Specyfikacja</h2>
          <table>
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
            <div style={{ marginTop: "20px" }}>
              <h3>Edytuj komentarz</h3>
              <textarea
                value={asset.comment || ""}
                onChange={(e) =>
                  setAsset({ ...asset, comment: e.target.value })
                }
                rows={3}
                style={{ width: "300px" }}
              />
              <br />
              <button onClick={saveComment}>Zapisz komentarz</button>
            </div>
          )}

          <h2>Lokalizacja</h2>
          <p>
            Lokalizacja:{" "}
            {asset.location ? (
              <Link to={`/locations/${asset.location.id}`}>
                {asset.location.code}
              </Link>
            ) : (
              "-"
            )}
            <br />
            Kontener:{" "}
            {asset.container ? (
              <Link to={`/containers/${asset.container.id}`}>
                {asset.container.code}
              </Link>
            ) : (
              "-"
            )}
          </p>

          {canEdit && (
            <Link to={`/assets/${id}/move`}>
              <button style={{ marginRight: "10px" }}>
                Przenieś asset
              </button>
            </Link>
          )}

          {user.role === "admin" && (
            <button
              onClick={deleteAsset}
              style={{ background: "red", color: "white" }}
            >
              Usuń asset
            </button>
          )}
        </div>

        {/* PRAWA KOLUMNA — HISTORIA */}
        <div>
          <h2>Historia ruchów</h2>

          <div
            style={{
              paddingRight: "10px",
              borderLeft: "2px solid #ddd",
              paddingLeft: "15px",
            }}
          >
            {history.length === 0 && <p>Brak historii.</p>}

            {history.length > 0 && (
              <>
                <ul>
                  {history.map((h) => (
                    <li key={h.id} style={{ marginBottom: "12px" }}>
                      <strong>
                        {new Date(h.moved_at).toLocaleString()}
                      </strong>
                      <br />
                      {(h.old_location_name || "-")} →{" "}
                      {(h.new_location_name || "-")}
                      <br />
                      {h.note?.trim() || "brak notatki"}
                      <br />
                      <em style={{ color: "#aaa" }}>
                        przeniósł: {h.moved_by || "nieznany"}
                      </em>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: "20px" }}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(
                    (num) => (
                      <button
                        key={num}
                        onClick={() => loadHistory(num)}
                        style={{
                          marginRight: "5px",
                          padding: "5px 10px",
                          background:
                            num === page ? "#333" : "#ddd",
                          color:
                            num === page ? "white" : "black",
                          border: "none",
                          cursor: "pointer",
                        }}
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
