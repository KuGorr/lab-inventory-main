import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);

    const res = await api.post(
      // "http://10.19.148.12:8000/auth/login",
      "http://localhost:8000/auth/login",
      form,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // ZAPIS TOKENA
    localStorage.setItem("token", res.data.access_token);

    // ZAPIS DANYCH UŻYTKOWNIKA (rola, nazwa)
    localStorage.setItem("user", JSON.stringify(res.data.user));

    navigate("/");
  } catch (err) {
    console.log("AXIOS ERROR:", err);

    if (err.response?.status === 401) {
      setError("Nieprawidłowy login lub hasło");
    } else {
      setError("Błąd połączenia z serwerem");
    }
  }
};

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Lab Inventory</div>
        <h2>Logowanie</h2>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Login</label>
            <input
              id="username"
              placeholder="Wpisz login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              placeholder="Wpisz hasło"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="msg-error">{error}</p>}

          <button type="submit">Zaloguj się</button>
        </form>
      </div>
    </div>
  );
}
