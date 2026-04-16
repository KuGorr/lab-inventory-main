import axios from "axios";

// ── Server config ─────────────────────────────────────────────
// DEV:  http://localhost:8000      ws://localhost:8000
// PROD: http://10.19.148.12:8000   ws://10.19.148.12:8000
//export const API_BASE = "http://localhost:8000";
//export const WS_BASE  = "ws://localhost:8000";
//export const API_BASE = "http://10.19.145.15:8000";
//export const WS_BASE  = "ws://10.19.145.15:8000";
export const API_BASE = "http://10.19.145.15:8001";
export const WS_BASE  = "ws://10.19.145.15:8001";
// ──────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: API_BASE });

// Automatyczne dodawanie tokena
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 GLOBALNY INTERCEPTOR BŁĘDÓW — AUTO WYLOGOWANIE
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Token nieważny / sesja wygasła / backend reset
    if (status === 401 || status === 403) {
      console.warn("Sesja wygasła — wylogowuję użytkownika.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Przekierowanie na stronę logowania
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
