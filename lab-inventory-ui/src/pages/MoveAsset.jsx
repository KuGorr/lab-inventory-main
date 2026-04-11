import { useEffect, useState } from "react";
import { API_BASE } from "../api/axios";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function MoveAsset() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [containers, setContainers] = useState([]);

  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/locations/`)
      .then(res => res.json())
      .then(data => setLocations(data));

    fetch(`${API_BASE}/containers/`)
      .then(res => res.json())
      .then(data => setContainers(data));
  }, []);

  // -----------------------------
  // Submit move
  // -----------------------------
  async function submitMove(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API_BASE}/assets/${id}/move`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        target,
        note
      })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Błąd przenoszenia assetu");
      return;
    }

    navigate(`/assets/${id}`);
  }

  return (
    <div className="page">
      <h1>Przenieś asset</h1>
      <Link to={`/assets/${id}`} className="back-link">← Powrót</Link>

      {error && (
        <p className="msg-error">
          {error}
        </p>
      )}

      <form onSubmit={submitMove}>
        <div className="form-row">
          <label>Nowa lokalizacja lub kontener:</label>

          <input
            list="targets"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Wpisz np. 9.3 lub CLA-022"
            required
          />

          <datalist id="targets">
            {locations.map(loc => (
              <option key={loc.id} value={loc.code}>
                {loc.code} — {loc.description}
              </option>
            ))}
            {containers.map(c => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.description}
              </option>
            ))}
          </datalist>
        </div>

        <div className="form-row">
          <label>Notatka:</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button type="submit" className="form-row">
          Przenieś
        </button>
      </form>
    </div>
  );
}
