// src/api/index.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE });

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post("/auth/login",    data),
  register: (data) => api.post("/auth/register", data),
  me:       ()     => api.get("/auth/me"),
};

// ── Workers ───────────────────────────────────────────────────────────────────
export const workerAPI = {
  getAll:   (p = {}) => api.get("/workers", { params: p }),
  getById:  (id)     => api.get(`/workers/${id}`),
  create:   (data)   => api.post("/workers", data),
  update:   (id, d)  => api.put(`/workers/${id}`, d),
  delete:   (id)     => api.delete(`/workers/${id}`),
  getStats: ()       => api.get("/workers/stats/summary"),
};

export default api;