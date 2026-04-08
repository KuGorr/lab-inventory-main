import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // GLOBAL FIX — usuwa marginesy i ustawia tło na CAŁEJ stronie
  useEffect(() => {
    document.body.style.margin = "0";
    document.documentElement.style.margin = "0";
    document.body.style.background = "var(--background-color, #111)";
    document.documentElement.style.background = "var(--background-color, #111)";
    document.body.style.overflowX = "hidden";
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        background: "var(--background-color, #111)",
        color: "var(--text-color, #fff)",
      }}
    >
      {/* FIXED SIDEBAR */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 220,
          height: "100vh",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "var(--sidebar-bg, #1a1a1a)",
          color: "var(--sidebar-text, #fff)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Lab Inventory</h3>

        <Link to="/" style={{ color: "inherit" }}>Assety</Link>
        <Link to="/containers" style={{ color: "inherit" }}>Kontenery</Link>
        <Link to="/locations" style={{ color: "inherit" }}>Lokalizacje</Link>
        <Link to="/history" style={{ color: "inherit" }}>Historia</Link>

        {user.role === "admin" && (
          <Link to="/admin/users" style={{ color: "inherit" }}>
            Panel administratora
          </Link>
        )}

        <button
          onClick={logout}
          style={{
            marginTop: "auto",
            background: "#c62828",
            color: "white",
            padding: "8px 12px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Wyloguj
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main
        style={{
          flexGrow: 1,
          padding: 20,
          paddingLeft: 240, // <-- to usuwa pasek, NIE margin-left
          overflowX: "hidden",
          background: "var(--background-color, #111)",
          color: "var(--text-color, #fff)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
