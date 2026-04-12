import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Theme toggle — mirrors Layout logic so the preference persists across pages
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("light-theme");
    else root.classList.remove("light-theme");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);

      const res = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Nieprawidłowy login lub hasło");
      } else {
        setError("Błąd połączenia z serwerem");
      }
    }
  };

  return (
    <div className="login-page">
      <button className="login-theme-toggle" onClick={toggleTheme}>
        {theme === "dark" ? "☀️ Jasny motyw" : "🌙 Ciemny motyw"}
      </button>

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
