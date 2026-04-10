import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const loadData = () => {
    // fetch(`http://10.19.148.12:8000/locations/${id}/contents`)
    fetch(`http://localhost:8000/locations/${id}/contents`)
      .then(res => {
        if (res.status === 404) {
          navigate("/locations"); // lokalizacja została usunięta przez kogoś innego
          return null;
        }
        return res.json();
      })
      .then(json => {
        if (json) setData(json);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // 🔥 REALTIME WEBSOCKET — automatyczne odświeżanie szczegółów lokalizacji
  useEffect(() => {
    // const ws = new WebSocket("ws://10.19.148.12:8000/ws/locations");
    const ws = new WebSocket("ws://localhost:8000/ws/locations");

    ws.onmessage = (event) => {
      if (event.data === "locations_updated") {
        loadData();
      }
    };

    return () => ws.close();
  }, [id]);

  if (!data) return <div>Ładowanie...</div>;

  return (
    <div className="page">
      <h1>Lokalizacja: {data.location}</h1>
      <Link to="/locations" className="back-link">← Lokalizacje</Link>

      {/* ----------------------------- */}
      {/* KONTENERY */}
      {/* ----------------------------- */}
      <h2>Kontenery w tej lokalizacji</h2>

      {data.containers.length === 0 && <p>Brak kontenerów.</p>}

      {data.containers.length > 0 && (
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
      )}

      {/* ----------------------------- */}
      {/* ASSETY */}
      {/* ----------------------------- */}
      <h2>Assety w tej lokalizacji</h2>

      {data.assets.length === 0 && <p>Brak assetów.</p>}

      {data.assets.length > 0 && (
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
      )}
    </div>
  );
}
