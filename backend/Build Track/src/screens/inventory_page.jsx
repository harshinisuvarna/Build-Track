import { useState, useEffect, useCallback } from "react";
import { inventoryAPI, projectAPI } from "../api";
import { Toast } from "../components/Toast";

const C = {
  orange : "#ea580c",
  orangeL: "#fff7ed",
  orangeB: "#fed7aa",
  green  : "#16a34a",
  greenL : "#dcfce7",
  greenB : "#bbf7d0",
  red    : "#dc2626",
  redL   : "#fee2e2",
  redB   : "#fca5a5",
  yellow : "#d97706",
  yellowL: "#fffbeb",
  yellowB: "#fde68a",
  text   : "#1a1a1a",
  sub    : "#888",
  border : "#ebebeb",
  bg     : "#f7f7f8",
  card   : "#ffffff",
};

function getStatus(balance, threshold = 5) {
  if (balance <= 0) return "Out of Stock";
  if (balance <= threshold) return "Low Stock";
  return "In Stock";
}

const STATUS_META = {
  "In Stock": { label: "In Stock", bg: C.greenL, color: C.green, dot: C.green },
  "Low Stock": { label: "Low Stock", bg: C.yellowL, color: C.yellow, dot: C.yellow },
  "Out of Stock": { label: "Out of Stock", bg: C.redL, color: C.red, dot: C.red },
};

export default function InventoryPage() {
  const [inventory,      setInventory]      = useState([]);
  const [projects,       setProjects]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState({ msg: "", type: "info" });
  const [search,         setSearch]         = useState("");
  const [filterProject,  setFilterProject]  = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [sortBy,         setSortBy]         = useState("name");   // name | stock | purchased | status
  const [sortDir,        setSortDir]        = useState("asc");
  const [thresholdDrafts, setThresholdDrafts] = useState({});
  const fetchInventory = useCallback(() => {
    setLoading(true);
    Promise.all([
      inventoryAPI.getAll(),
      projectAPI.getAll(),
    ])
      .then(([invRes, projRes]) => {
        const items = invRes.data.inventory || [];
        setInventory(items);
        setProjects(projRes.data.projects  || []);
        const drafts = {};
        items.forEach((item) => {
          drafts[item._id] = Number(item.threshold ?? 5);
        });
        setThresholdDrafts(drafts);
      })
      .catch(() => setToast({ msg: "Failed to load inventory", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = inventory
    .filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.materialName?.toLowerCase().includes(q);
      const projectId = item.project?._id || item.project;
      const status = item.status || getStatus(item.closingStock, item.threshold);
      const matchProject = filterProject === "all" || String(projectId) === filterProject;
      const matchStatus  = filterStatus  === "all" || status === filterStatus;
      return matchSearch && matchProject && matchStatus;
    })
    .sort((a, b) => {
      let va, vb;
      if      (sortBy === "name")      { va = a.materialName?.toLowerCase(); vb = b.materialName?.toLowerCase(); }
      else if (sortBy === "stock")     { va = a.closingStock;  vb = b.closingStock; }
      else if (sortBy === "purchased") { va = a.purchased;     vb = b.purchased; }
      else if (sortBy === "status")    {
        const ord = { "In Stock": 0, "Low Stock": 1, "Out of Stock": 2 };
        va = ord[a.status || getStatus(a.closingStock, a.threshold)];
        vb = ord[b.status || getStatus(b.closingStock, b.threshold)];
      }
      if (va < vb) return sortDir === "asc" ? -1 :  1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const totalItems   = inventory.length;
  const lowItems     = inventory.filter(i => (i.status || getStatus(i.closingStock, i.threshold)) === "Low Stock").length;
  const emptyItems   = inventory.filter(i => (i.status || getStatus(i.closingStock, i.threshold)) === "Out of Stock").length;
  const totalPurchased = inventory.reduce((s, i) => s + (i.purchased || 0), 0);
  const totalUsed = inventory.reduce((s, i) => s + (i.used || 0), 0);

  async function saveThreshold(item) {
    if (!item?._id) return;
    const nextThreshold = Number(thresholdDrafts[item._id]);
    if (!Number.isFinite(nextThreshold) || nextThreshold < 0) {
      setToast({ msg: "Threshold must be a number >= 0", type: "error" });
      return;
    }
    try {
      await inventoryAPI.updateThreshold(item._id, nextThreshold);
      setToast({ msg: "Threshold updated", type: "success" });
      fetchInventory();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed to update threshold", type: "error" });
    }
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ color: "#ccc", fontSize: 10 }}>↕</span>;
    return <span style={{ color: C.orange, fontSize: 10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };
  const inp = {
    padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, fontSize: 13, color: C.text, outline: "none",
    fontFamily: "'Segoe UI', sans-serif",
  };
  const sel = { ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 };

  return (
    <div style={{ padding: 28, fontFamily: "'Segoe UI', sans-serif", background: C.bg, minHeight: "100vh" }}>
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "info" })} />

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>Material Inventory</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: C.sub }}>
          Real-time stock levels across all projects
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Materials", value: totalItems,     icon: "📦", color: C.orange, bg: C.orangeL, border: C.orangeB },
          { label: "In Stock",        value: totalItems - lowItems - emptyItems, icon: "✅", color: C.green,  bg: C.greenL,  border: C.greenB  },
          { label: "Low Stock",       value: lowItems,       icon: "⚠️",  color: C.yellow, bg: C.yellowL, border: C.yellowB },
          { label: "Out of Stock",    value: emptyItems,     icon: "🚫",  color: C.red,    bg: C.redL,    border: C.redB    },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: kpi.bg, border: `1px solid ${kpi.border}`,
            borderRadius: 16, padding: "20px 22px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: kpi.color, fontWeight: 600, marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts Banner ── */}
      {(lowItems > 0 || emptyItems > 0) && (
        <div style={{
          background: emptyItems > 0 ? C.redL : C.yellowL,
          border: `1px solid ${emptyItems > 0 ? C.redB : C.yellowB}`,
          borderRadius: 12, padding: "14px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>{emptyItems > 0 ? "🚨" : "⚠️"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: emptyItems > 0 ? C.red : C.yellow }}>
              {emptyItems > 0 ? `${emptyItems} material(s) out of stock!` : `${lowItems} material(s) running low`}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              Create a Materials → Purchase transaction to restock.
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "16px 20px", marginBottom: 20,
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials…"
            style={{ ...inp, paddingLeft: 36, width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Project filter */}
        <div style={{ position: "relative" }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...sel, minWidth: 180 }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 11, pointerEvents: "none" }}>▾</span>
        </div>

        {/* Status filter */}
        <div style={{ position: "relative" }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sel, minWidth: 150 }}>
            <option value="all">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 11, pointerEvents: "none" }}>▾</span>
        </div>

        <button
          onClick={fetchInventory}
          style={{
            padding: "9px 18px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", color: C.sub,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
        overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: C.sub }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading inventory…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: C.sub }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No materials found</div>
            <div style={{ fontSize: 13 }}>
              {inventory.length === 0
                ? "Add a Materials → Purchase transaction to start tracking stock."
                : "Try adjusting your filters."}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: `1px solid ${C.border}` }}>
                {[
                  { label: "MATERIAL",    col: "name",      align: "left"  },
                  { label: "PROJECT",     col: null,        align: "left"  },
                  { label: "PURCHASED",   col: "purchased", align: "right" },
                  { label: "USED",        col: null,        align: "right" },
                  { label: "BALANCE",     col: "stock",     align: "right" },
                    { label: "THRESHOLD",   col: null,        align: "center"  },
                  { label: "STATUS",      col: "status",    align: "center"},
                ].map(h => (
                  <th
                    key={h.label}
                    onClick={() => h.col && toggleSort(h.col)}
                    style={{
                      padding: "14px 18px", textAlign: h.align,
                      fontSize: 11, fontWeight: 700, color: "#888",
                      letterSpacing: "0.06em", userSelect: "none",
                      cursor: h.col ? "pointer" : "default",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.label} {h.col && <SortIcon col={h.col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const status = item.status || getStatus(item.closingStock, item.threshold);
                const meta   = STATUS_META[status];
                const projectId = item.project?._id || item.project;
                const projectName = item.project?.projectName || projects.find(p => String(p._id) === String(projectId))?.projectName;

                return (
                  <tr
                    key={item._id}
                    style={{
                      borderBottom: `1px solid #f5f5f5`,
                      background: idx % 2 === 0 ? C.card : "#fafafa",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? C.card : "#fafafa"}
                  >
                    {/* Material */}
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{item.materialName}</div>
                      {item.unit && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>({item.unit})</div>}
                    </td>

                    {/* Project */}
                    <td style={{ padding: "16px 18px" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: C.orange,
                        background: C.orangeL, border: `1px solid ${C.orangeB}`,
                        borderRadius: 20, padding: "3px 10px",
                      }}>
                        {projectName || "—"}
                      </span>
                    </td>

                    {/* Purchased */}
                    <td style={{ padding: "16px 18px", textAlign: "right", fontWeight: 600, color: C.text }}>
                      {(item.purchased || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Used */}
                    <td style={{ padding: "16px 18px", textAlign: "right", color: C.red, fontWeight: 600 }}>
                      {(item.used || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Balance */}
                    <td style={{
                      padding: "16px 18px", textAlign: "right",
                      fontWeight: 800, fontSize: 15,
                      color: status === "empty" ? C.red : status === "low" ? C.yellow : C.green,
                    }}>
                      {(item.closingStock || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Threshold */}
                    <td style={{ padding: "16px 18px", textAlign: "center", minWidth: 160 }}>
                      {item._id ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            value={thresholdDrafts[item._id] ?? 5}
                            onChange={(e) =>
                              setThresholdDrafts((prev) => ({ ...prev, [item._id]: e.target.value }))
                            }
                            style={{ width: 72, ...inp, textAlign: "right", padding: "6px 8px" }}
                          />
                          <button
                            onClick={() => saveThreshold(item)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: `1px solid ${C.orangeB}`,
                              background: C.orangeL,
                              color: C.orange,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: C.sub, fontSize: 12 }}>Default: 5</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: "16px 18px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: meta.bg, color: meta.color,
                        border: `1px solid ${meta.color}22`,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer summary ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 12, color: C.sub, textAlign: "right" }}>
          Showing {filtered.length} of {inventory.length} materials ·{" "}
          Purchased: <strong>{totalPurchased.toLocaleString("en-IN")}</strong> · Used: <strong>{totalUsed.toLocaleString("en-IN")}</strong>
        </div>
      )}
    </div>
  );
}
