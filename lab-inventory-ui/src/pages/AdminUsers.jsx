import { useEffect, useState } from "react";
import { API_BASE } from "../api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  const [passwordChange, setPasswordChange] = useState({
    userId: null,
    newPassword: "",
  });

  const [editUser, setEditUser] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ---------------------------------------
  // LOAD USERS
  // ---------------------------------------
  const loadUsers = async () => {
    setError("");

    const res = await fetch(`${API_BASE}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setError("Nie udało się pobrać listy użytkowników");
      return;
    }

    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    })();
  }, [token]);

  // ---------------------------------------
  // CREATE USER
  // ---------------------------------------
  const createUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("Login i hasło są wymagane");
      return;
    }

    const res = await fetch(`${API_BASE}/users/`, {
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

    setForm({ username: "", email: "", password: "", role: "user" });
    loadUsers();
  };

  // ---------------------------------------
  // DELETE USER
  // ---------------------------------------
  const deleteUser = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć użytkownika?")) return;

    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Nie udało się usunąć użytkownika");
      return;
    }

    loadUsers();
  };

  // ---------------------------------------
  // CHANGE ROLE
  // ---------------------------------------
  const changeRole = async (id, newRole) => {
    setError("");

    const res = await fetch(`${API_BASE}/users/${id}/role?new_role=${newRole}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Nie udało się zmienić roli");
      return;
    }

    loadUsers();
  };

  // ---------------------------------------
  // SAVE USER EDIT (MODAL)
  // ---------------------------------------
  const saveUserEdit = async () => {
    if (!editUser.username) {
      setError("Login nie może być pusty");
      return;
    }

    try {
      // UPDATE EMAIL
      await fetch(
        `${API_BASE}/users/${editUser.id}/email?new_email=${editUser.email}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // UPDATE ROLE
      await fetch(
        `${API_BASE}/users/${editUser.id}/role?new_role=${editUser.role}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // UPDATE PASSWORD (optional)
      if (editUser.newPassword) {
        await fetch(
          `${API_BASE}/users/${editUser.id}/password?new_password=${editUser.newPassword}`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setEditUser(null);
      loadUsers();
    } catch (err) {
      setError("Nie udało się zapisać zmian");
    }
  };

  // ---------------------------------------
  // FILTER USERS
  // ---------------------------------------
  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------------------------------
  // ACCESS CONTROL
  // ---------------------------------------
  if (user.role !== "admin") {
    return <div className="page">Brak dostępu.</div>;
  }

  return (
    <div className="page">
      <h1>Panel administratora — użytkownicy</h1>

      {error && <p className="msg-error">{error}</p>}

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Szukaj użytkownika..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input search-input--sm"
      />

      {/* CREATE USER */}
      <h2>Dodaj użytkownika</h2>
      <form onSubmit={createUser} className="inline-form">
        <input
          placeholder="Login"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          placeholder="Hasło"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="user">user</option>
          <option value="compat">compat</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>

        <button type="submit">Dodaj</button>
      </form>

      {/* USER LIST */}
      <h2>Lista użytkowników</h2>

      <div className="table-scroll-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Login</th>
              <th>Email</th>
              <th>Rola</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email || "-"}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="compat">compat</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <div className="btn-row">
                    {/* EDIT BUTTON */}
                    <button
                      className="btn-info"
                      onClick={() =>
                        setEditUser({
                          id: u.id,
                          username: u.username,
                          email: u.email || "",
                          role: u.role,
                          newPassword: "",
                        })
                      }
                    >
                      Edytuj
                    </button>

                    {/* DELETE USER */}
                    <button
                      className="btn-danger"
                      onClick={() => deleteUser(u.id)}
                    >
                      Usuń
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p>Brak wyników.</p>}

      {/* MODAL EDIT USER */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edytuj użytkownika</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditUser(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <div className="field">
                <label>Login</label>
                <input
                  value={editUser.username}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser({ ...editUser, email: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>Rola</label>
                <select
                  value={editUser.role}
                  onChange={(e) =>
                    setEditUser({ ...editUser, role: e.target.value })
                  }
                >
                  <option value="user">user</option>
                  <option value="compat">compat</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="field">
                <label>Nowe hasło (opcjonalnie)</label>
                <input
                  type="password"
                  value={editUser.newPassword}
                  onChange={(e) =>
                    setEditUser({ ...editUser, newPassword: e.target.value })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditUser(null)}
                >
                  Anuluj
                </button>
                <button onClick={saveUserEdit}>Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
