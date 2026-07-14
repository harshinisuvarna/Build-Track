import { useState, useEffect, useCallback } from "react";
import { inventoryAPI, projectAPI } from "../api";
import { Toast } from "../components/Toast";
import { colors, radius, spacing, shadows, gradients, typography } from "../styles/designTokens";

const STATUS_META = {
  "In Stock":    { label: "In Stock",    bg: "#E8F5E9", border: "#43A047", text: "#2E7D32" },
  "Low Stock":   { label: "Low Stock",   bg: "#FFF8E1", border: "#FFC107", text: "#F57F17" },
  "Out of Stock":{ label: "Out of Stock",bg: "#FFEBEE", border: "#E53935", text: "#C62828" },
};

function getStatus(balance, threshold = 5) {
  if (balance <= 0) return "Out of Stock";
  if (balance <= threshold) return "Low Stock";
  return "In Stock";
}

const TABS = [
  { key: "materials", label: "Materials", icon: "M12 2l9 4.5v9L12 20l-9-4.5v-9L12 2zm0 2.1L4.5 8.25 12 12.4l7.5-4.15L12 4.1z" },
  { key: "labour",    label: "Labour",    icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
  { key: "equipment", label: "Equipment", icon: "M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z" },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [thresholdDrafts, setThresholdDrafts] = useState({});

  const fetchInventory = useCallback(() => {
    setLoading(true);
    Promise.all([inventoryAPI.getAll(), projectAPI.getAll()])
      .then(([invRes, projRes]) => {
        const items = invRes.data.inventory || [];
        setInventory(items);
        setProjects(projRes.data.projects || []);
        const drafts = {};
        items.forEach(item => { drafts[item._id] = Number(item.threshold ?? 5); });
        setThresholdDrafts(drafts);
      })
      .catch(() => setToast({ msg: "Failed to load inventory", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filtered = inventory.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.materialName?.toLowerCase().includes(q) || item.brand?.toLowerCase().includes(q) || item.vendor?.toLowerCase().includes(q);
    const pid = item.project?._id || item.project;
    const matchProject = !selectedProjectId || String(pid) === selectedProjectId;
    const status = item.status || getStatus(item.closingStock, item.threshold);
    const matchStatus = filterStatus === "all" || status === filterStatus;
    return matchSearch && matchProject && matchStatus;
  });

  const totalItems = inventory.length;
  const lowItems = inventory.filter(i => (i.status || getStatus(i.closingStock, i.threshold)) === "Low Stock").length;
  const emptyItems = inventory.filter(i => (i.status || getStatus(i.closingStock, i.threshold)) === "Out of Stock").length;
  const inStockItems = totalItems - lowItems - emptyItems;
  const totalPurchased = inventory.reduce((s, i) => s + (i.purchased || 0), 0);
  const totalUsed = inventory.reduce((s, i) => s + (i.used || 0), 0);

  const selProject = selectedProjectId ? projects.find(p => String(p._id) === selectedProjectId) : null;
  const projectLabel = selProject?.projectName || "All Active Projects";

  async function saveThreshold(item) {
    if (!item?._id) return;
    const next = Number(thresholdDrafts[item._id]);
    if (!Number.isFinite(next) || next < 0) {
      setToast({ msg: "Threshold must be >= 0", type: "error" });
      return;
    }
    try {
      await inventoryAPI.updateThreshold(item._id, next);
      setToast({ msg: "Threshold updated", type: "success" });
      fetchInventory();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed to update threshold", type: "error" });
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", minHeight: "100vh",
      fontFamily: typography.fontFamily, background: colors.bgBase4,
    }}>
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "info" })} />

      {/* Top Bar */}
      <div style={{
        background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`,
        padding: "16px 24px",
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>Inventory</h1>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textLight }}>
          {loading ? "Loading..." : `${inventory.length} material${inventory.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 40px" }}>
        {/* Project Selector */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: colors.cardBg, borderRadius: radius.md,
          border: `1px solid #E0E5FF`, boxShadow: shadows.card,
          padding: "11px 14px", cursor: "pointer", marginBottom: 12,
        }} onClick={() => setSelectedProjectId(null)}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: `${colors.primaryBlue}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: colors.textLight, letterSpacing: "0.08em", marginBottom: 2, textTransform: "uppercase" }}>Project Context</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>{projectLabel}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </div>

        {/* Search + Status Filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: colors.cardBg, borderRadius: radius.md, border: `1px solid #E8E5F6`, padding: "0 14px", boxShadow: shadows.card }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, vendor, brand..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, color: colors.textPrimary, background: "transparent", height: 48 }} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: "0 14px", borderRadius: radius.md, border: `1px solid #E8E5F6`,
              background: colors.cardBg, fontSize: 13, color: colors.textPrimary,
              outline: "none", cursor: "pointer", minWidth: 130,
            }}>
            <option value="all">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <button onClick={fetchInventory}
            style={{
              padding: "0 16px", borderRadius: radius.md, border: `1px solid #E8E5F6`,
              background: colors.cardBg, color: colors.textLight, fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 5, padding: 5, marginBottom: 16,
          background: colors.cardBg, borderRadius: radius.md,
          border: `1px solid #E8E5F6`, boxShadow: shadows.card,
        }}>
          {TABS.map((tab, i) => {
            const active = i === activeTab;
            return (
              <button key={tab.key} onClick={() => setActiveTab(i)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: active ? gradients.primaryButton : "transparent",
                  color: active ? "#FFF" : "#4B4966",
                  fontWeight: active ? 800 : 600, fontSize: 12.5, transition: "all 0.2s",
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={tab.icon} /></svg>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* KPI Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Total Materials", value: String(totalItems), color: colors.primaryBlue, icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M10 12h4", alert: false },
            { label: "In Stock", value: String(inStockItems), color: "#10B981", icon: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", alert: false },
            { label: "Low Stock", value: String(lowItems), color: "#F59E0B", icon: "M12 9v2m0 4h.01m-6.93 5h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z", alert: lowItems > 0 },
            { label: "Out of Stock", value: String(emptyItems), color: "#EF4444", icon: "M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", alert: emptyItems > 0 },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: colors.cardBg, borderRadius: radius.lg,
              border: `1px solid ${kpi.alert ? `${kpi.color}50` : colors.cardBorder}`,
              padding: 13, boxShadow: shadows.card,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, marginBottom: 10,
                background: `${kpi.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={kpi.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={kpi.icon} /></svg>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.3px", marginBottom: 2 }}>{kpi.value}</div>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: colors.textLight }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        {(lowItems > 0 || emptyItems > 0) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: radius.md, marginBottom: 16,
            background: emptyItems > 0 ? "#FEF2F2" : "#FFFBEB",
            border: `1px solid ${emptyItems > 0 ? "#FCA5A5" : "#FDE68A"}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={emptyItems > 0 ? "#EF4444" : "#F59E0B"} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: emptyItems > 0 ? "#DC2626" : "#B45309" }}>
                {emptyItems > 0 ? `${emptyItems} material(s) out of stock!` : `${lowItems} material(s) running low`}
              </div>
              <div style={{ fontSize: 12, color: colors.textLight }}>Adjust thresholds or restock to maintain supply.</div>
            </div>
          </div>
        )}

        {/* Card List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${colors.bgBase4}`, borderTopColor: colors.primaryBlue, animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, color: colors.textLight }}>Loading inventory...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: colors.textLight }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {inventory.length === 0 ? "Add a Purchase transaction to start tracking stock." : "No materials match your filters."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(item => {
              const status = item.status || getStatus(item.closingStock, item.threshold);
              const meta = STATUS_META[status] || STATUS_META["In Stock"];
              const pid = item.project?._id || item.project;
              const pName = item.project?.projectName || projects.find(p => String(p._id) === String(pid))?.projectName || "";
              const balance = item.closingStock || 0;
              return (
                <div key={item._id} style={{
                  background: colors.cardBg, borderRadius: radius.lg,
                  border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
                  padding: "16px 18px",
                }}>
                  {/* Row 1: Name, Status, Project */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{item.materialName}</span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                          background: meta.bg, border: `1px solid ${meta.border}`,
                          color: meta.text,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.text }} />
                          {meta.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: colors.textLight }}>
                        {pName && <span style={{ fontWeight: 600 }}>{pName}</span>}
                        {item.unit && <span> &middot; {item.unit}</span>}
                        {item.brand && <span> &middot; {item.brand}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Stock Metrics */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8, marginBottom: 12,
                    background: `${colors.primaryPurple}08`,
                    borderRadius: radius.sm, padding: "10px 12px",
                  }}>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: colors.textLight, letterSpacing: "0.05em", marginBottom: 2 }}>QTY</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
                        {balance.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: colors.textLight, letterSpacing: "0.05em", marginBottom: 2 }}>PURCHASED</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.primaryBlue }}>
                        {(item.purchased || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: colors.textLight, letterSpacing: "0.05em", marginBottom: 2 }}>USED</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#EF4444" }}>
                        {(item.used || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Threshold + Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: colors.textLight }}>Threshold:</span>
                      <input type="number" min="0"
                        value={thresholdDrafts[item._id] ?? 5}
                        onChange={e => setThresholdDrafts(prev => ({ ...prev, [item._id]: e.target.value }))}
                        style={{
                          width: 60, padding: "6px 8px", borderRadius: radius.sm,
                          border: `1px solid ${colors.cardBorder}`, fontSize: 12,
                          color: colors.textPrimary, background: colors.cardBg, outline: "none",
                          textAlign: "right",
                        }} />
                      <button onClick={() => saveThreshold(item)}
                        style={{
                          padding: "6px 12px", borderRadius: radius.sm,
                          border: `1px solid ${colors.cardBorder}`, background: colors.cardBg,
                          color: colors.primaryBlue, fontWeight: 700, fontSize: 11,
                          cursor: "pointer",
                        }}>Save</button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{
                        padding: "8px 16px", borderRadius: radius.sm, border: "none",
                        background: gradients.primaryButton, color: "#FFF",
                        fontWeight: 700, fontSize: 12, cursor: "pointer",
                      }}>
                        Add More
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 12, color: colors.textLight, textAlign: "right" }}>
            Showing {filtered.length} of {inventory.length} materials &middot;
            Purchased: <strong>{(totalPurchased).toLocaleString("en-IN")}</strong> &middot;
            Used: <strong>{(totalUsed).toLocaleString("en-IN")}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
