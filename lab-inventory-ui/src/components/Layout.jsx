import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) return saved === "true";
    return window.innerWidth > 960;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("light-theme");
    else root.classList.remove("light-theme");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const toggleSidebar = () =>
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarOpen", String(next));
      return next;
    });

  // Close sidebar after navigation on small screens
  const handleNavClick = () => {
    if (window.innerWidth <= 960) {
      setSidebarOpen(false);
      localStorage.setItem("sidebarOpen", "false");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {/* Backdrop — small screens only (CSS hides it on desktop) */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={toggleSidebar} />
      )}

      <aside className={`sidebar${sidebarOpen ? "" : " sidebar--closed"}`}>
        <h3>Lab Inventory</h3>

        <Link to="/" onClick={handleNavClick}>Assety</Link>
        <Link to="/containers" onClick={handleNavClick}>Kontenery</Link>
        <Link to="/locations" onClick={handleNavClick}>Lokalizacje</Link>
        <Link to="/history" onClick={handleNavClick}>Historia</Link>

        {user.role === "admin" && (
          <Link to="/admin/users" onClick={handleNavClick}>Panel administratora</Link>
        )}

        <div className="sidebar-bottom">
          <button onClick={toggleTheme} className="btn-theme-toggle">
            {theme === "dark" ? "☀️ Jasny motyw" : "🌙 Ciemny motyw"}
          </button>
          <button onClick={logout} className="sidebar-logout">
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Edge tab — slides with sidebar border (hidden on small screens via CSS) */}
      <button
        className={`sidebar-edge-btn${sidebarOpen ? "" : " sidebar--closed"}`}
        onClick={toggleSidebar}
        title={sidebarOpen ? "Zwiń menu" : "Rozwiń menu"}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>

      <main className={`main-content${sidebarOpen ? "" : " sidebar--closed"}`}>
        {children}
      </main>
    </div>
  );
}
