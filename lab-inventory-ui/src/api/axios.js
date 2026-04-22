import axios from "axios";

// ── Server config (dynamic via .env) ─────────────────────────────
// Vite automatycznie wstrzykuje zmienne zaczynające się od VITE_
// do import.meta.env podczas builda.

export const API_BASE = import.meta.env.VITE_API_URL;
export const WS_BASE  = import.meta.env.VITE_WS_URL;

// ────────────────────────────────────────────────────────────────

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

    if (status === 401 || status === 403) {
      console.warn("Sesja wygasła — wylogowuję użytkownika.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
