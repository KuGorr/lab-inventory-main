import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "",
    description: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const loadLocations = useCallback(async () => {
    // const res = await fetch("http://10.19.148.12:8000/locations/");
    const res = await fetch("http://localhost:8000/locations/");
    const data = await res.json();

    setLocations(data.sort((a, b) => a.code.localeCompare(b.code)));
  }, []);

  useEffect(() => {
    (async () => {
      // const res = await fetch("http://10.19.148.12:8000/locations/");
      const res = await fetch("http://localhost:8000/locations/");
      const data = await res.json();
      setLocations(data.sort((a, b) => a.code.localeCompare(b.code)));
    })();
  }, []);

  // 🔥 REALTIME WEBSOCKET — automatyczne odświeżanie listy lokalizacji
  useEffect(() => {
    // const ws = new WebSocket("ws://10.19.148.12:8000/ws/locations");
    const ws = new WebSocket("ws://localhost:8000/ws/locations");

    ws.onmessage = (event) => {
      if (event.data === "locations_updated") {
        loadLocations();
      }
    };

    return () => ws.close();
  }, [loadLocations]);

  const createLocation = async (e) => {
    e.preventDefault();

    // await fetch("http://10.19.148.12:8000/locations/", {
    await fetch("http://localhost:8000/locations/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    setForm({ code: "", description: "" });
    loadLocations();
  };

  const deleteLocation = async (id) => {
    // await fetch(`http://10.19.148.12:8000/locations/${id}`, {
    await fetch(`http://localhost:8000/locations/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    loadLocations();
  };

  const filtered = locations.filter((loc) => {
    const text = search.toLowerCase();

    return (
      loc.code.toLowerCase().includes(text) ||
      loc.description?.toLowerCase().includes(text)
    );
  });

  return (
    <div className="page">
      <h1>Lokalizacje</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Szukaj po kodzie lub opisie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input search-input--sm"
      />

      {(user.role === "manager" || user.role === "admin") && (
        <>
          <h2>Dodaj lokalizację</h2>
          <form onSubmit={createLocation} className="inline-form">
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
            <button type="submit">Dodaj</button>
          </form>
        </>
      )}

      {/* 🔥 LICZNIK LOKALIZACJI */}
      <div className="result-counter">
        Wyniki: {filtered.length} / {locations.length}
      </div>

      <h2>Lista lokalizacji</h2>

      <table>
        <thead>
          <tr>
            <th>Kod</th>
            <th>Opis</th>
            <th>Akcje</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((loc) => (
            <tr key={loc.id}>
              <td>
                <Link to={`/locations/${loc.id}`}>{loc.code}</Link>
              </td>
              <td>{loc.description}</td>
              <td>
                {user.role === "admin" && (
                  <button className="btn-danger" onClick={() => deleteLocation(loc.id)}>Usuń</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p>Brak wyników.</p>
      )}
    </div>
  );
}
