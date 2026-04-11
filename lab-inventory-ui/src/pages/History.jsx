import { useCallback, useEffect, useState } from "react";
import { API_BASE, WS_BASE } from "../api/axios";
import { Link } from "react-router-dom";

export default function History() {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [movedBy, setMovedBy] = useState("");
  const [users, setUsers] = useState([]);

  // -----------------------------
  // Load history
  // -----------------------------
  const loadHistory = useCallback((pageNum = 1, moved = movedBy) => {
    let url = `${API_BASE}/assets/history?page=${pageNum}`;
    if (moved) url += `&moved_by=${moved}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setHistory(data.items);
        setPages(data.pages);
        setPage(data.page);
      });
  }, [movedBy]);

  useEffect(() => {
    fetch(`${API_BASE}/assets/history?page=1`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.items);
        setPages(data.pages);
        setPage(data.page);
      });

    fetch(`${API_BASE}/assets/history/users`)
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  // Append new entries as moves happen across the system
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/history`);

    ws.onmessage = (event) => {
      if (event.data === "history_updated") {
        loadHistory(page, movedBy);
      }
    };

    return () => ws.close();
  }, [loadHistory, page, movedBy]);

  // -----------------------------
  // Filter by user
  // -----------------------------
  const handleFilter = () => {
    loadHistory(1, movedBy);
  };

  const clearFilter = () => {
    setMovedBy("");
    loadHistory(1, "");
  };

  return (
    <div className="page">
      <h1>Globalna historia ruchów</h1>
      <Link to="/" className="back-link">← Assety</Link>

      {/* FILTR */}
      <div className="history-filter">
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
        >
          <option value="">Wszyscy użytkownicy</option>
          {users.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        {movedBy && (
          <button onClick={clearFilter} className="btn-clear-x">
            ✕
          </button>
        )}
      </div>

      {/* TABELA */}
      <table className="table-wide">
        <thead>
          <tr>
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
      <div className="pagination">
        {Array.from({ length: pages }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => loadHistory(num)}
            className={num === page ? "active" : ""}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
