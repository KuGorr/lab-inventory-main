import axios from "axios";

const api = axios.create({
  // baseURL: "http://10.19.148.12:8000",
  baseURL: "http://localhost:8000",
});

// Automatyczne dodawanie tokena
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
