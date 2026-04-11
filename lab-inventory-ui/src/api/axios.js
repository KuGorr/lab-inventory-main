import axios from "axios";

// ── Server config ─────────────────────────────────────────────
// DEV:  http://localhost:8000      ws://localhost:8000
// PROD: http://10.19.148.12:8000   ws://10.19.148.12:8000
export const API_BASE = "http://localhost:8000";
export const WS_BASE  = "ws://localhost:8000";
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

export default api;
