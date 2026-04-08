import { useEffect, useRef, useState } from "react";
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

  // -----------------------------
  // LOAD DATA
  // -----------------------------
  const loadContainers = () => {
    fetch("http://10.19.148.12:8000/containers")
      .then((res) => res.json())
      .then((data) => setContainers(data));
  };

  const loadLocations = () => {
    fetch("http://10.19.148.12:8000/locations")
      .then((res) => res.json())
      .then((data) => setLocations(data));
  };

  useEffect(() => {
    loadContainers();
    loadLocations();
  }, []);

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

    await fetch("http://10.19.148.12:8000/containers/", {
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
    await fetch(`http://10.19.148.12:8000/containers/${id}`, {
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
    return (
      c.code?.toLowerCase().includes(text) ||
      c.description?.toLowerCase().includes(text) ||
      c.location?.code?.toLowerCase().includes(text)
    );
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1>Kontenery</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Szukaj po kodzie, opisie, lokalizacji..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "400px",
          padding: "8px",
          marginBottom: "15px",
          fontSize: "16px",
        }}
      />

      {/* CREATE FORM */}
      {(user.role === "manager" || user.role === "admin") && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Dodaj kontener</h2>

          <form onSubmit={createContainer}>
            <input
              placeholder="Kod"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              style={{ marginRight: "10px" }}
            />

            <input
              placeholder="Opis"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ marginRight: "10px" }}
            />

            {/* AUTOCOMPLETE LOCATION */}
            <div
              ref={dropdownRef}
              style={{
                position: "relative",
                display: "inline-block",
                marginRight: "10px",
              }}
            >
              <input
                placeholder="Wybierz lub wpisz lokalizację..."
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                style={{ width: "200px" }}
              />

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "35px",
                    left: 0,
                    width: "100%",
                    background: "white",
                    border: "1px solid #ccc",
                    maxHeight: "150px",
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  {locations
                    .filter((loc) =>
                      loc.code
                        .toLowerCase()
                        .includes(locationSearch.toLowerCase())
                    )
                    .map((loc) => (
                      <div
                        key={loc.id}
                        style={{
                          padding: "6px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                        }}
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
                    <div style={{ padding: "6px", color: "#888" }}>
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

      {/* TABLE */}
      <table border="1" cellPadding="4">
        <thead>
          <tr>
            <th>Kod</th>
            <th>Opis</th>
            <th>Lokalizacja</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/containers/${c.id}`}>{c.code}</Link>
              </td>
              <td>{c.description}</td>
              <td>{c.location?.code || "-"}</td>
              <td>
                {user.role === "admin" && (
                  <button onClick={() => deleteContainer(c.id)}>Usuń</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p style={{ marginTop: "10px" }}>Brak wyników.</p>
      )}
    </div>
  );
}
