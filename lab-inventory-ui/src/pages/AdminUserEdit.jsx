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
    // fetch("http://10.19.148.12:8000/users/", {
    fetch("http://localhost:8000/users/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const u = data.find((x) => x.id === Number(id));
        setUser(u);
        setRole(u.role);
      });
  }, [id, token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch(
      // `http://10.19.148.12:8000/users/${id}/role?new_role=${role}`,
      `http://localhost:8000/users/${id}/role?new_role=${role}`,
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
    <div className="page">
      <h1>Edytuj użytkownika: {user.username}</h1>
      <Link to="/admin/users" className="back-link">← Użytkownicy</Link>

      {error && <p className="msg-error">{error}</p>}

      <form onSubmit={submit}>
        <div className="form-row">
          <label>Rola:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">user</option>
            <option value="compat">compat</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <button type="submit" className="form-row">
          Zapisz
        </button>
      </form>
    </div>
  );
}
