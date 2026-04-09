import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function MoveContainer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://10.19.148.12:8000/locations/")
      .then(res => res.json())
      .then(data => setLocations(data));
  }, []);

  async function submitMove(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(`http://10.19.148.12:8000/containers/${id}/move`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ target, note })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Błąd przenoszenia kontenera");
      return;
    }

    navigate(`/containers/${id}`);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Przenieś kontener</h1>
      <Link to={`/containers/${id}`}>← Powrót</Link>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}

      <form onSubmit={submitMove}>
        <div>
          <label>Nowa lokalizacja:</label><br />

          <input
            list="locations"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Wpisz np. 9.3"
            required
            style={{ width: "300px" }}
          />

          <datalist id="locations">
            {locations.map(loc => (
              <option key={loc.id} value={loc.code}>
                {loc.code} — {loc.description}
              </option>
            ))}
          </datalist>
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>Notatka:</label><br />
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ width: "300px", height: "80px" }}
          />
        </div>

        <button type="submit" style={{ marginTop: "15px" }}>
          Przenieś
        </button>
      </form>
    </div>
  );
}
