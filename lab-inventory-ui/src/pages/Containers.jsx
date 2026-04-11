import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, WS_BASE } from "../api/axios";
import { Link } from "react-router-dom";

export default function Containers() {
  const [containers, setContainers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");

  const [locationSearch, setLocationSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    location_id: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // ⭐ STATUS FILTER
  const [statusFilter, setStatusFilter] = useState("all");

  // -----------------------------
  // LOAD DATA
  // -----------------------------
  const loadContainers = useCallback(() => {
    fetch(`${API_BASE}/containers/`)
      .then((res) => res.json())
      .then((data) => setContainers(data));
  }, []);

  const loadLocations = useCallback(() => {
    fetch(`${API_BASE}/locations/`)
      .then((res) => res.json())
      .then((data) => setLocations(data));
  }, []);

  useEffect(() => {
    loadContainers();
    loadLocations();
  }, [loadContainers, loadLocations]);

  // Keep table in sync when another user modifies containers
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/containers`);

    ws.onmessage = (event) => {
      if (event.data === "containers_updated") {
        loadContainers();
      }
    };

    return () => ws.close();
  }, [loadContainers]);

  // -----------------------------
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // -----------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------
  // CREATE CONTAINER
  // -----------------------------
  const createContainer = async (e) => {
    e.preventDefault();

    await fetch(`${API_BASE}/containers/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    setForm({ code: "", description: "", location_id: "" });
    setLocationSearch("");
    loadContainers();
  };

  // -----------------------------
  // DELETE CONTAINER
  // -----------------------------
  const deleteContainer = async (id) => {
    await fetch(`${API_BASE}/containers/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    loadContainers();
  };

  // -----------------------------
  // FILTERING
  // -----------------------------
  const filtered = containers.filter((c) => {
    const text = search.toLowerCase();

    const matchesSearch =
      c.code?.toLowerCase().includes(text) ||
      c.description?.toLowerCase().includes(text) ||
      c.location?.code?.toLowerCase().includes(text) ||
      c.comment?.toLowerCase().includes(text);

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "none"
        ? !c.status
        : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <h1>Kontenery</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Szukaj po kodzie, opisie, lokalizacji, komentarzu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      {/* CREATE FORM */}
      {(user.role === "manager" || user.role === "admin") && (
        <div className="section">
          <h2>Dodaj kontener</h2>

          <form onSubmit={createContainer} className="inline-form">
            <input
              placeholder="Kod"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />

            <input
              placeholder="Opis"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            {/* AUTOCOMPLETE LOCATION */}
            <div ref={dropdownRef} className="loc-autocomplete">
              <input
                placeholder="Wybierz lub wpisz lokalizację..."
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />

              {showDropdown && (
                <div className="loc-dropdown">
                  {locations
                    .filter((loc) =>
                      loc.code
                        .toLowerCase()
                        .includes(locationSearch.toLowerCase())
                    )
                    .map((loc) => (
                      <div
                        key={loc.id}
                        className="loc-dropdown-item"
                        onClick={() => {
                          setForm({ ...form, location_id: loc.id });
                          setLocationSearch(loc.code);
                          setShowDropdown(false);
                        }}
                      >
                        {loc.code} — {loc.description}
                      </div>
                    ))}

                  {locations.filter((loc) =>
                    loc.code
                      .toLowerCase()
                      .includes(locationSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="loc-dropdown-empty">
                      Brak wyników
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit">Dodaj</button>
          </form>
        </div>
      )}

      {/* STATUS FILTER */}
      <div className="status-filter">
        <button
          onClick={() => setStatusFilter("all")}
          className={`status-btn ${statusFilter === "all" ? "active active-all" : ""}`}
          title="Wszystkie"
        >
          ⭐
        </button>

        <button
          onClick={() =>
            setStatusFilter(statusFilter === "none" ? "all" : "none")
          }
          className={`status-btn ${statusFilter === "none" ? "active active-none" : ""}`}
          title="Brak statusu"
        >
          ◻️?
        </button>

        <button
          onClick={() =>
            setStatusFilter(statusFilter === "available" ? "all" : "available")
          }
          className={`status-btn ${statusFilter === "available" ? "active active-available" : ""}`}
          title="Dostępny"
        >
          ✅
        </button>

        <button
          onClick={() =>
            setStatusFilter(statusFilter === "borrowed" ? "all" : "borrowed")
          }
          className={`status-btn ${statusFilter === "borrowed" ? "active active-borrowed" : ""}`}
          title="Wypożyczony"
        >
          🔄
        </button>

        <button
          onClick={() =>
            setStatusFilter(statusFilter === "broken" ? "all" : "broken")
          }
          className={`status-btn ${statusFilter === "broken" ? "active active-broken" : ""}`}
          title="Uszkodzony"
        >
          🗑️
        </button>

        <button
          onClick={() =>
            setStatusFilter(statusFilter === "lost" ? "all" : "lost")
          }
          className={`status-btn ${statusFilter === "lost" ? "active active-lost" : ""}`}
          title="Zagubiony"
        >
          ❓
        </button>
      </div>

      {/* 🔥 LICZNIK KONTENERÓW */}
      <div className="result-counter result-counter--tight">
        Wyniki: {filtered.length} / {containers.length}
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th className="col-status">S</th>
            <th>Kod</th>
            <th>Opis</th>
            <th>Lokalizacja</th>
            <th>Komentarz</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const statusIcon =
              c.status === "available"
                ? "✅"
                : c.status === "borrowed"
                ? "🔄"
                : c.status === "broken"
                ? "🗑️"
                : c.status === "lost"
                ? "❓"
                : "◻️?";

            return (
              <tr key={c.id}>
                <td className="status-icon-cell">
                  {statusIcon}
                </td>

                <td>
                  <Link to={`/containers/${c.id}`}>{c.code}</Link>
                </td>
                <td>{c.description}</td>
                <td>{c.location?.code || "-"}</td>
                <td>{c.comment?.trim() || "-"}</td>
                <td>
                  {user.role === "admin" && (
                    <button className="btn-danger" onClick={() => deleteContainer(c.id)}>Usuń</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && <p>Brak wyników.</p>}
    </div>
  );
}
