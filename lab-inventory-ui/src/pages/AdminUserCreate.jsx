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

    const res = await fetch("http://10.19.148.12:8000/users/", {
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
    <div style={{ padding: "20px" }}>
      <h1>Dodaj użytkownika</h1>
      <Link to="/admin/users">← Powrót</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={submit}>
        <div>
          <label>Login:</label><br />
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Hasło:</label><br />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Rola:</label><br />
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

        <button type="submit" style={{ marginTop: "15px" }}>
          Utwórz
        </button>
      </form>
    </div>
  );
}
