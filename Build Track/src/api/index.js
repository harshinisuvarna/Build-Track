import axios from "axios";

function normalizeOrigin(url) {
  if (!url) return "";
  return url.replace(/\/+$/, "");
}

const rawUrl = import.meta.env.VITE_API_URL;
if (!rawUrl) {
  console.warn(
    "[BuildTrack] VITE_API_URL is not set. " +
    "Create a .env file with VITE_API_URL=https://build-track.onrender.com"
  );
}

const API_ORIGIN = normalizeOrigin(rawUrl) || "http://localhost:5000";
const BASE = API_ORIGIN.endsWith("/api") ? API_ORIGIN : `${API_ORIGIN}/api`;

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && !window.location.pathname.startsWith("/login")) {
      localStorage.removeItem("bt_token");
      localStorage.removeItem("bt_user");
      window.location.assign("/login");
    }
    if (!err.response) {
      err.friendlyMessage =
        "Cannot reach the server. Check your internet connection or try again later.";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          (data) => api.post("/auth/login",    data),
  register:       (data) => api.post("/auth/register", data),
  me:             ()     => api.get("/auth/me"),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword:  (data) => api.post("/auth/reset-password",  data),
  changePassword: (data) => api.put("/auth/change-password",  data),
  toggle2FA:      ()     => api.put("/auth/toggle-2fa"),
  signOutAll:     ()     => api.post("/auth/sign-out-all"),
  deleteAccount:  ()     => api.delete("/auth/account"),
};

export const workerAPI = {
  getAll:         (p = {}) => api.get("/workers", { params: p }),
  getSupervisors: ()       => api.get("/workers/supervisors"),
  getById:        (id)     => api.get(`/workers/${id}`),
  create:         (data)   => api.post("/workers", data),
  update:         (id, d)  => api.put(`/workers/${id}`, d),
  delete:         (id)     => api.delete(`/workers/${id}`),
  getStats:       ()       => api.get("/workers/stats/summary"),
};

export const projectAPI = {
  getAll:  (p = {}) => api.get("/projects", { params: p }),
  getById: (id)     => api.get(`/projects/${id}`),
  getStats:(id)     => api.get(`/projects/${id}/stats`),
  create:  (data)   => api.post("/projects", data),
  update:  (id, d)  => api.put(`/projects/${id}`, d),
  delete:  (id)     => api.delete(`/projects/${id}`),
};

export const transactionAPI = {
  getAll: (p = {}) => api.get("/transactions", { params: p }),
  create: (data)   => api.post("/transactions", data),
  delete: (id)     => api.delete(`/transactions/${id}`),
};

export const dashboardAPI = {
  getSummary: () => api.get("/dashboard/summary"),
};

export const reportAPI = {
  getFinancial: (params) => api.get("/reports/financial", { params }),
  exportCSV:    (params) => api.get("/reports/financial/export-csv", { params, responseType: "blob" }),
  exportPDF:    (params) => api.get("/reports/financial/export-pdf", { params, responseType: "blob" }),
};

export const userAPI = {
  updateProfile: (data) => api.put("/auth/profile", data),
  updatePhoto:   (fd)   => api.put("/auth/photo",   fd),
};

export const voiceAPI = {
  parse: (data) => api.post("/voice/parse", data),
};

export const inventoryAPI = {
  getAll: () => api.get("/inventory"),
  use: (data) => api.post("/inventory/use", data),
};

export { API_ORIGIN };
export default api;