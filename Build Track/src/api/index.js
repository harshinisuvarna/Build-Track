// src/api/index.js
import axios from "axios";

function normalizeOrigin(url) {
  if (!url) return "";
  // trim trailing slashes
  return url.replace(/\/+$/, "");
}

// Supports:
// - VITE_API_URL=http://localhost:5000        (preferred)
// - VITE_API_URL=http://localhost:5000/api    (also works)
// Fallback is local backend.
const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_URL) || "http://localhost:5000";
const BASE = API_ORIGIN.endsWith("/api") ? API_ORIGIN : `${API_ORIGIN}/api`;

const api = axios.create({ baseURL: BASE });

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token is missing/expired, send user back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // Avoid loops if already on /login
      if (!window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("bt_token");
        localStorage.removeItem("bt_user");
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post("/auth/login",    data),
  register: (data) => api.post("/auth/register", data),
  me:       ()     => api.get("/auth/me"),
};

// ── Workers ───────────────────────────────────────────────────────────────────
export const workerAPI = {
  getAll:        (p = {}) => api.get("/workers", { params: p }),
  getSupervisors: ()      => api.get("/workers/supervisors"),   // ← NEW
  getById:       (id)     => api.get(`/workers/${id}`),
  create:        (data)   => api.post("/workers", data),
  update:        (id, d)  => api.put(`/workers/${id}`, d),
  delete:        (id)     => api.delete(`/workers/${id}`),
  getStats:      ()       => api.get("/workers/stats/summary"),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectAPI = {
  getAll:  (p = {}) => api.get("/projects", { params: p }),
  getById: (id)     => api.get(`/projects/${id}`),
  create:  (data)   => api.post("/projects", data),        // data = FormData
  update:  (id, d)  => api.put(`/projects/${id}`, d),      // d = FormData
  delete:  (id)     => api.delete(`/projects/${id}`),
};

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactionAPI = {
  getAll:  (p = {}) => api.get("/transactions", { params: p }),
  create:  (data)   => api.post("/transactions", data),    // data = plain JSON obj
  delete:  (id)     => api.delete(`/transactions/${id}`),
};

export default api;