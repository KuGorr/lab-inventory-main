import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://10.19.148.12:8000/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const u = data.find((x) => x.id === Number(id));
        setUser(u);
        setRole(u.role);
      });
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch(
      `http://10.19.148.12:8000/users/${id}/role?new_role=${role}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Nie udało się zmienić roli");
      return;
    }

    navigate("/admin/users");
  };

  if (!user) return <div>Ładowanie...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Edytuj użytkownika: {user.username}</h1>
      <Link to="/admin/users">← Powrót</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={submit}>
        <div>
          <label>Rola:</label><br />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">user</option>
            <option value="compat">compat</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: "15px" }}>
          Zapisz
        </button>
      </form>
    </div>
  );
}
