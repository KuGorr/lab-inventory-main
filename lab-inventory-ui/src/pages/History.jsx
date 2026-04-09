import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function History() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [movedBy, setMovedBy] = useState("");
  const [users, setUsers] = useState([]);

  const loadHistory = (pageNum = 1, moved = movedBy) => {
    let url = `http://10.19.148.12:8000/assets/history?page=${pageNum}`;
    if (moved) url += `&moved_by=${moved}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setHistory(data.items);
        setPages(data.pages);
        setPage(data.page);
      });
  };

  useEffect(() => {
    loadHistory(1);

    fetch("http://10.19.148.12:8000/assets/history/users")
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  // 🔥 REALTIME WEBSOCKET — automatyczne odświeżanie historii
  useEffect(() => {
    const ws = new WebSocket("ws://10.19.148.12:8000/ws/history");

    ws.onmessage = (event) => {
      if (event.data === "history_updated") {
        loadHistory(page, movedBy);
      }
    };

    return () => ws.close();
  }, [page, movedBy]);

  const handleFilter = () => {
    loadHistory(1, movedBy);
  };

  const clearFilter = () => {
    setMovedBy("");
    loadHistory(1, "");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Globalna historia ruchów</h1>
      <Link to="/">← Powrót</Link>

      {/* FILTR */}
      <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
        
        <select
          value={movedBy}
          onChange={e => {
            const value = e.target.value;
            setMovedBy(value);
            loadHistory(1, value);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") handleFilter();
          }}
          style={{ padding: "6px", minWidth: "200px" }}
        >
          <option value="">Wszyscy użytkownicy</option>
          {users.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {movedBy && (
          <button
            onClick={clearFilter}
            style={{
              padding: "6px 10px",
              background: "#ccc",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* TABELA */}
      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th>TAG</th>
            <th>Nazwa</th>
            <th>Skąd</th>
            <th>Dokąd</th>
            <th>Kto</th>
            <th>Kiedy</th>
            <th>Notatka</th>
          </tr>
        </thead>
        <tbody>
          {history.map(h => (
            <tr key={h.moved_at + h.asset_tag}>
              <td>
                {h.type === "asset" && (
                  <Link to={`/assets/${h.asset_id}`}>{h.asset_tag}</Link>
                )}

                {h.type === "container" && (
                  <Link to={`/containers/${h.container_id}`}>{h.asset_tag}</Link>
                )}
              </td>

              <td>{h.asset_name}</td>
              <td>{h.old_location_name || "-"}</td>
              <td>{h.new_location_name || "-"}</td>
              <td>{h.moved_by || "-"}</td>
              <td>{new Date(h.moved_at).toLocaleString()}</td>
              <td>{h.note && h.note.trim() !== "" ? h.note : "brak notatki"}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
    </div>
  );
}
