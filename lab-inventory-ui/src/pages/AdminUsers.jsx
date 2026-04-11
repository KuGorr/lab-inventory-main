import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  // NEW: state for password change
  const [passwordChange, setPasswordChange] = useState({
    userId: null,
    newPassword: "",
  });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ---------------------------------------
  // LOAD USERS
  // ---------------------------------------
  const loadUsers = async () => {
    setError("");

    // const res = await fetch("http://10.19.148.12:8000/users/", {
    const res = await fetch("http://localhost:8000/users/", {
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
      // const res = await fetch("http://10.19.148.12:8000/users/", {
      const res = await fetch("http://localhost:8000/users/", {
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

    setForm({ username: "", password: "", role: "user" });
    loadUsers();
  };

  // ---------------------------------------
  // DELETE USER
  // ---------------------------------------
  const deleteUser = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć użytkownika?")) return;

    // const res = await fetch(`http://10.19.148.12:8000/users/${id}`, {
    const res = await fetch(`http://localhost:8000/users/${id}`, {
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

    const res = await fetch(
      // `http://10.19.148.12:8000/users/${id}/role?new_role=${newRole}`,
      `http://localhost:8000/users/${id}/role?new_role=${newRole}`,
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

    loadUsers();
  };

  // ---------------------------------------
  // CHANGE PASSWORD
  // ---------------------------------------
  const changePassword = async () => {
    if (!passwordChange.newPassword) {
      setError("Hasło nie może być puste");
      return;
    }

    const res = await fetch(
      // `http://10.19.148.12:8000/users/${passwordChange.userId}/password?new_password=${passwordChange.newPassword}`,
      `http://localhost:8000/users/${passwordChange.userId}/password?new_password=${passwordChange.newPassword}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Nie udało się zmienić hasła");
      return;
    }

    setPasswordChange({ userId: null, newPassword: "" });
    loadUsers();
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

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Login</th>
            <th>Rola</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
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
                  {/* CHANGE PASSWORD BUTTON */}
                  {passwordChange.userId === u.id ? (
                    <>
                      <input
                        type="password"
                        placeholder="Nowe hasło"
                        value={passwordChange.newPassword}
                        onChange={(e) =>
                          setPasswordChange({
                            ...passwordChange,
                            newPassword: e.target.value,
                          })
                        }
                        style={{ width: "160px" }}
                      />
                      <button onClick={changePassword}>Zapisz</button>
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setPasswordChange({ userId: null, newPassword: "" })
                        }
                      >
                        Anuluj
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-info"
                      onClick={() =>
                        setPasswordChange({ userId: u.id, newPassword: "" })
                      }
                    >
                      Zmień hasło
                    </button>
                  )}

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

      {filtered.length === 0 && <p>Brak wyników.</p>}
    </div>
  );
}
