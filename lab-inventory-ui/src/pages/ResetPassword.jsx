import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (password !== password2) {
      setError("Hasła nie są takie same");
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });

      setMsg("Hasło zostało zmienione. Możesz się zalogować.");
    } catch (err) {
      setError("Token wygasł lub jest nieprawidłowy.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Lab Inventory</div>
        <h2>Ustaw nowe hasło</h2>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="password">Nowe hasło</label>
            <input
              id="password"
              type="password"
              placeholder="Wpisz nowe hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label htmlFor="password2">Powtórz hasło</label>
            <input
              id="password2"
              type="password"
              placeholder="Powtórz hasło"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {msg && <p className="msg-success">{msg}</p>}
          {error && <p className="msg-error">{error}</p>}

          <button type="submit">Zmień hasło</button>
        </form>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <Link to="/login">Powrót do logowania</Link>
        </div>
      </div>
    </div>
  );
}
