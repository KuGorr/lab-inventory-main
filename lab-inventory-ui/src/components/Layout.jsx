import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Theme: persisted in localStorage, applied as class on <html>
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {/* FIXED SIDEBAR */}
      <aside className="sidebar">
        <h3>Lab Inventory</h3>

        <Link to="/">Assety</Link>
        <Link to="/containers">Kontenery</Link>
        <Link to="/locations">Lokalizacje</Link>
        <Link to="/history">Historia</Link>

        {user.role === "admin" && (
          <Link to="/admin/users">
            Panel administratora
          </Link>
        )}

        {/* Bottom controls: theme toggle + logout */}
        <div className="sidebar-bottom">
          <button onClick={toggleTheme} className="btn-theme-toggle">
            {theme === "dark" ? "☀️ Jasny motyw" : "🌙 Ciemny motyw"}
          </button>

          <button onClick={logout} className="sidebar-logout">
            Wyloguj
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
