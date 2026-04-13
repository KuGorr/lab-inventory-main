import { useCallback, useEffect, useState } from "react";
import { API_BASE, WS_BASE } from "../api/axios";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const loadData = useCallback(() => {
    fetch(`${API_BASE}/locations/${id}/contents`)
      .then(res => {
        if (res.status === 404) { navigate("/locations"); return null; }
        return res.json();
      })
      .then(json => { if (json) setData(json); });
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when another user moves assets/containers in this location
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/locations`);

    ws.onerror = () => {};
    ws.onmessage = (event) => {
      if (event.data === "locations_updated") {
        loadData();
      }
    };

    return () => ws.close();
  }, [loadData]);

  if (!data) return <div>Ładowanie...</div>;

  return (
    <div className="page">
      <h1>Lokalizacja: {data.location}</h1>
      <Link to="/locations" className="back-link">← Lokalizacje</Link>

      <h2>Kontenery w tej lokalizacji</h2>

      {data.containers.length === 0 && <p>Brak kontenerów.</p>}

      {data.containers.length > 0 && (
        <div className="table-scroll-wrap">
        <table>
          <thead>
            <tr>
              <th>Kod</th>
            </tr>
          </thead>
          <tbody>
            {data.containers.map(c => (
              <tr key={c.id}>
                <td>
                  <Link to={`/containers/${c.id}`}>{c.code}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <h2>Assety w tej lokalizacji</h2>

      {data.assets.length === 0 && <p>Brak assetów.</p>}

      {data.assets.length > 0 && (
        <div className="table-scroll-wrap">
        <table>
          <thead>
            <tr>
              <th>Tag</th>
            </tr>
          </thead>
          <tbody>
            {data.assets.map(a => (
              <tr key={a.id}>
                <td>
                  <Link to={`/assets/${a.id}`}>{a.tag}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
