import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { workerAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";
import { resolveImageUrl } from "../utils/imageUrl";

const ITEMS_PER_PAGE = 7;

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function WorkerAvatar({ worker, size = 38, borderRadius = 10, fontSize = 13 }) {
  const avatarColors = ["#ea580c", "#0ea5e9", "#16a34a", "#7c3aed", "#db2777"];
  let hash = 0;
  for (const c of (worker.name || "")) hash = c.charCodeAt(0) + hash;
  const color = avatarColors[hash % avatarColors.length];

  return worker.photo ? (
    <img
      src={resolveImageUrl(worker.photo)}
      alt={worker.name}
      style={{
        width: size, height: size, borderRadius,
        objectFit: "cover", flexShrink: 0,
        border: "2px solid #f0f0f0",
      }}
      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius,
      background: "#fff5f0", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize, fontWeight: 700, color, flexShrink: 0,
    }}>
      {getInitials(worker.name)}
    </div>
  );
}

export default function WorkerDirectory() {
  const navigate = useNavigate();

  const [allWorkers,  setAllWorkers]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filter,      setFilter]      = useState("All Workers");
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
  const [toast,       setToast]       = useState({ msg: "", type: "info" });
  const [confirmDlg,  setConfirmDlg]  = useState(null);
  const filterRef = useRef(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await workerAPI.getAll();
      setAllWorkers(data.workers || []);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      setError(status ? `Failed to load workers (${status}): ${msg}` : `Failed to load workers: ${msg}`);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => { fetchWorkers(); }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilters(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = allWorkers.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.trade.toLowerCase().includes(search.toLowerCase());

    if (filter === "Active")           return matchSearch && w.status === "Active";
    if (filter === "Inactive")         return matchSearch && w.status === "Inactive";
    if (filter === "High Wage (>₹5k)") return matchSearch && w.dailyWage > 5000;
    return matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilter = (f) => { setFilter(f); setPage(1); setShowFilters(false); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const handleEdit = (worker) => {
    navigate("/newworker", { state: { editWorker: worker } });
  };

  const handleDelete = (workerId) => {
    const worker = allWorkers.find(w => w._id === workerId);
    setConfirmDlg({
      message: `Delete "${worker?.name || 'this worker'}"? This action cannot be undone.`,
      danger: true,
      confirmLabel: "Delete Worker",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await workerAPI.delete(workerId);
          setAllWorkers((prev) => prev.filter((w) => w._id !== workerId));
          setPage(1);
          setToast({ msg: `"${worker?.name || 'Worker'}" deleted successfully.`, type: "success" });
        } catch (err) {
          setToast({ msg: err.response?.data?.message || "Failed to delete worker.", type: "error" });
        }
      },
    });
  };

  const exportWorkers = () => {
    const header = "Name,Trade,Status,Daily Wage\n";
    const rows   = filtered.map((w) => `${w.name},${w.trade},${w.status},${w.dailyWage}`).join("\n");
    const blob   = new Blob([header + rows], { type: "text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "workers.csv"; a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", height: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f7f7f8", overflow: "hidden",
    }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && (
        <ConfirmDialog
          message={confirmDlg.message}
          danger={confirmDlg.danger}
          confirmLabel={confirmDlg.confirmLabel}
          onConfirm={confirmDlg.onConfirm}
          onCancel={() => setConfirmDlg(null)}
        />
      )}

      {/* Top Bar */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12, flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Worker Directory</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
            {loading ? "Loading…" : `${allWorkers.length} worker${allWorkers.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <button
          onClick={() => navigate("/newworker")}
          style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
        >
          👤+ Add Worker
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", color: "#991b1b", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Search + Filter Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 14px", gap: 8 }}>
            <span style={{ color: "#aaa" }}>🔍</span>
            <input
              value={search} onChange={handleSearch}
              placeholder="Search by name or trade..."
              style={{ border: "none", outline: "none", fontSize: 13, color: "#555", background: "transparent", width: isMobile ? 160 : 260 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div ref={filterRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: "8px 14px", background: showFilters ? "#ea580c" : "#f5f5f5",
                  border: `1px solid ${showFilters ? "#ea580c" : "#e5e5e5"}`,
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", color: showFilters ? "#fff" : "#555",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                ≡ Filters
              </button>
              {showFilters && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "#fff", border: "1px solid #e5e5e5",
                  borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  padding: "8px", zIndex: 100, minWidth: 180,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", padding: "6px 10px 4px", letterSpacing: "0.06em" }}>FILTER BY</div>
                  {[
                    { label: "All Workers",      dot: null },
                    { label: "Active",           dot: "#16a34a" },
                    { label: "Inactive",         dot: "#aaa" },
                    { label: "High Wage (>₹5k)", dot: "#ea580c" },
                  ].map(({ label, dot }) => (
                    <button
                      key={label}
                      onClick={() => handleFilter(label)}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 10px",
                        background: filter === label ? "#fff5f0" : "transparent",
                        border: "none", borderRadius: 8, fontSize: 13,
                        fontWeight: filter === label ? 700 : 500,
                        color: filter === label ? "#ea580c" : "#444",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }} />}
                      {!dot && <span style={{ width: 7, height: 7, display: "inline-block", flexShrink: 0 }} />}
                      {label}
                      {filter === label && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={exportWorkers}
              style={{ padding: "8px 14px", background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}
            >
              ⬇ Export
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["All Workers", "Active", "Inactive", "High Wage (>₹5k)"].map((f) => (
            <button key={f} onClick={() => handleFilter(f)}
              style={{
                padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background:  filter === f ? "#ea580c" : "#fff",
                color:       filter === f ? "#fff"    : "#555",
                borderColor: filter === f ? "#ea580c" : "#e5e5e5",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

          {/* Loading state */}
          {loading && (
            <div style={{ padding: 48, textAlign: "center", color: "#aaa", fontSize: 14 }}>
              Loading workers…
            </div>
          )}

          {/* Desktop Table */}
          {!loading && !isMobile && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {["WORKER NAME", "TRADE", "STATUS", "DAILY WAGE", "ACTIONS"].map((col) => (
                    <th key={col} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((w) => (
                  <tr key={w._id} style={{ borderBottom: "1px solid #f9f9f9" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <WorkerAvatar worker={w} size={38} borderRadius={10} fontSize={13} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{w.name}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{w.displayId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "#444" }}>{w.trade}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: w.status === "Active" ? "#dcfce7" : "#fee2e2", color: w.status === "Active" ? "#166534" : "#991b1b" }}>
                        {w.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                      ₹{Number(w.dailyWage).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => handleEdit(w)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Edit worker"
                        >✏️</button>
                        <button
                          onClick={() => handleDelete(w._id)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff5f5", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete worker"
                        >🗑️</button>
                      </div>  
                    </td>
                  </tr>
                ))}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 14 }}>
                      {allWorkers.length === 0 ? "No workers yet. Click \"Add Worker\" to get started." : "No workers match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Mobile Cards */}
          {!loading && isMobile && (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {paginated.map((w) => (
                <div key={w._id} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <WorkerAvatar worker={w} size={38} borderRadius={10} fontSize={13} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{w.displayId}</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: w.status === "Active" ? "#dcfce7" : "#fee2e2", color: w.status === "Active" ? "#166534" : "#991b1b" }}>
                      {w.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>Trade</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{w.trade}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#aaa" }}>Daily Wage</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>₹{Number(w.dailyWage).toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEdit(w)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", cursor: "pointer", fontSize: 13 }} title="Edit">✏️</button>
                      <button onClick={() => handleDelete(w._id)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff5f5", cursor: "pointer", fontSize: 13 }} title="Delete">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              {paginated.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                  {allWorkers.length === 0 ? "No workers yet." : "No workers match your search."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#888" }}>
              Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} workers
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#ccc" : "#555", fontWeight: 500 }}>
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid", fontSize: 13, cursor: "pointer", fontWeight: 600, borderColor: page === p ? "#ea580c" : "#e5e5e5", background: page === p ? "#ea580c" : "#fff", color: page === p ? "#fff" : "#555" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e5e5", background: "#fff", fontSize: 13, cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#ccc" : "#555", fontWeight: 500 }}>
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}