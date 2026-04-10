import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("Login i hasło są wymagane");
      return;
    }

    // const res = await fetch("http://10.19.148.12:8000/users/", {
    const res = await fetch("http://localhost:8000/users/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Nie udało się utworzyć użytkownika");
      return;
    }

    navigate("/admin/users");
  };

  return (
    <div className="page">
      <h1>Dodaj użytkownika</h1>
      <Link to="/admin/users" className="back-link">← Użytkownicy</Link>

      {error && <p className="msg-error">{error}</p>}

      <form onSubmit={submit}>
        <div className="form-row">
          <label>Login:</label>
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <label>Hasło:</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <label>Rola:</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">user</option>
            <option value="compat">compat</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <button type="submit" className="form-row">
          Utwórz
        </button>
      </form>
    </div>
  );
}
