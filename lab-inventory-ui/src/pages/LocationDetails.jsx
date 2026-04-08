import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function LocationDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://10.19.148.12:8000/locations/${id}/contents`)
      .then(res => res.json())
      .then(data => setData(data));
  }, [id]);

  if (!data) return <div>Ładowanie...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Lokalizacja: {data.location}</h1>
      <Link to="/locations">← Powrót</Link>

      {/* ----------------------------- */}
      {/* KONTENERY */}
      {/* ----------------------------- */}
      <h2>Kontenery w tej lokalizacji</h2>

      {data.containers.length === 0 && <p>Brak kontenerów.</p>}

      {data.containers.length > 0 && (
        <table border="1" cellPadding="4">
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
        <table border="1" cellPadding="4">
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
