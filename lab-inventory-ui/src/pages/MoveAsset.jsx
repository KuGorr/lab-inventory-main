import { useEffect, useState } from "react";
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
    fetch("http://10.19.148.12:8000/locations")
      .then(res => res.json())
      .then(data => setLocations(data));

    fetch("http://10.19.148.12:8000/containers")
      .then(res => res.json())
      .then(data => setContainers(data));
  }, []);

  async function submitMove(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(`http://10.19.148.12:8000/assets/${id}/move`, {
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
    <div style={{ padding: "20px" }}>
      <h1>Przenieś asset</h1>
      <Link to={`/assets/${id}`}>← Powrót</Link>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}

      <form onSubmit={submitMove}>
        <div>
          <label>Nowa lokalizacja lub kontener:</label><br />

          <input
            list="targets"
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Wpisz np. 9.3 lub CLA-022"
            style={{ width: "300px" }}
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
