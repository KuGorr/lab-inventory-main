import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await api.post("/auth/request-password-reset", { email });

      setMsg("Jeśli podany email istnieje w systemie, wysłaliśmy link resetujący.");
    } catch (err) {
      setMsg("Jeśli podany email istnieje w systemie, wysłaliśmy link resetujący.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Lab Inventory</div>
        <h2>Reset hasła</h2>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Adres email</label>
            <input
              id="email"
              placeholder="Wpisz swój email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {msg && <p className="msg-success">{msg}</p>}
          {error && <p className="msg-error">{error}</p>}

          <button type="submit">Wyślij link resetujący</button>
        </form>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <Link to="/login">Powrót do logowania</Link>
        </div>
      </div>
    </div>
  );
}
