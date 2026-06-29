import { useState } from "react";

export default function Export() {
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleDownload = () => {
    if (selectedStatuses.length === 0) {
      alert("Wybierz przynajmniej jeden status.");
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL;
    const params = new URLSearchParams();

    selectedStatuses.forEach((s) => params.append("status", s));

    const url = `${apiBase}/export/assets-csv?${params.toString()}`;
    window.location.href = url;
  };

  return (
    <div className="page">
      <h1>Eksport CSV</h1>
      <p>Wybierz statusy assetów, które mają znaleźć się w pliku CSV.</p>

      {/* STATUS BUTTONS — identyczne jak w Assets.jsx */}
      <div className="status-filter" style={{ marginBottom: 20 }}>
        <button
          onClick={() => toggleStatus("none")}
          className={`status-btn ${
            selectedStatuses.includes("none") ? "active active-none" : ""
          }`}
          title="Brak statusu"
        >
          ◻️?
        </button>

        <button
          onClick={() => toggleStatus("available")}
          className={`status-btn ${
            selectedStatuses.includes("available")
              ? "active active-available"
              : ""
          }`}
          title="Dostępny"
        >
          ✅
        </button>

        <button
          onClick={() => toggleStatus("borrowed")}
          className={`status-btn ${
            selectedStatuses.includes("borrowed")
              ? "active active-borrowed"
              : ""
          }`}
          title="Wypożyczony"
        >
          🔄
        </button>

        <button
          onClick={() => toggleStatus("broken")}
          className={`status-btn ${
            selectedStatuses.includes("broken")
              ? "active active-broken"
              : ""
          }`}
          title="Uszkodzony"
        >
          🗑️
        </button>

        <button
          onClick={() => toggleStatus("lost")}
          className={`status-btn ${
            selectedStatuses.includes("lost")
              ? "active active-lost"
              : ""
          }`}
          title="Zagubiony"
        >
          ❓
        </button>
      </div>

      <button onClick={handleDownload} className="btn-primary">
        Pobierz CSV
      </button>
    </div>
  );
}
