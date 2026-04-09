import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);

  // PAGINACJA
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const loadAsset = () => {
    fetch(`http://10.19.148.12:8000/assets/${id}`)
      .then(res => {
        if (res.status === 404) {
          navigate("/assets"); // asset został usunięty przez kogoś innego
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setAsset(data);
      });
  };

  const loadHistory = (pageNum = 1) => {
    fetch(`http://10.19.148.12:8000/assets/${id}/history?page=${pageNum}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.items);
        setPages(data.pages);
        setPage(data.page);
      });
  };

  useEffect(() => {
    loadAsset();
    loadHistory(1);
  }, [id]);

  // 🔥 REALTIME WEBSOCKET — automatyczne odświeżanie szczegółów assetu
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

  // -----------------------------
  // DELETE ASSET (admin only)
  // -----------------------------
  const deleteAsset = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten asset?")) return;

    await fetch(`http://10.19.148.12:8000/assets/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    navigate("/assets");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Szczegóły assetu: {asset.tag}</h1>
      <Link to="/">← Powrót</Link>

      {/* SPECYFIKACJA */}
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

      {/* LOKALIZACJA */}
      <h2>Lokalizacja</h2>
      <p>
        Lokalizacja:{" "}
        {asset.location ? (
          <Link to={`/locations/${asset.location.id}`}>{asset.location.code}</Link>
        ) : (
          "-"
        )}
        <br />
        Kontener:{" "}
        {asset.container ? (
          <Link to={`/containers/${asset.container.id}`}>{asset.container.code}</Link>
        ) : (
          "-"
        )}
      </p>

      {/* PRZENOŚ ASSET */}
      {(user.role === "compat" || user.role === "manager" || user.role === "admin") && (
        <Link to={`/assets/${id}/move`}>
          <button style={{ marginRight: "10px" }}>Przenieś asset</button>
        </Link>
      )}

      {/* USUŃ ASSET */}
      {user.role === "admin" && (
        <button onClick={deleteAsset} style={{ background: "red", color: "white" }}>
          Usuń asset
        </button>
      )}

      {/* HISTORIA */}
      <h2>Historia ruchów</h2>

      {history.length === 0 && <p>Brak historii.</p>}

      {history.length > 0 && (
        <>
          <ul>
            {history.map(h => (
              <li key={h.id} style={{ marginBottom: "12px" }}>
                <strong>{new Date(h.moved_at).toLocaleString()}</strong>
                <br />
                {(h.old_location_name || "-")} → {(h.new_location_name || "-")}
                <br />
                {h.note && h.note.trim() !== "" ? h.note : "brak notatki"}
                <br />
                <em style={{ color: "#aaa" }}>
                  przeniósł: {h.moved_by || "nieznany"}
                </em>
              </li>
            ))}
          </ul>

          {/* PAGINACJA */}
          <div style={{ marginTop: "20px" }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => loadHistory(num)}
                style={{
                  marginRight: "5px",
                  padding: "5px 10px",
                  background: num === page ? "#333" : "#ddd",
                  color: num === page ? "white" : "black",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
