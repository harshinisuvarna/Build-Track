import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectAPI, transactionAPI, inventoryAPI } from "../api";
import { resolveImageUrl } from "../utils/imageUrl";
import { calcProgress, getPhaseProgress, toggleActivity } from "../utils/constructionPhases";
import { Toast, ConfirmDialog } from "../components/Toast";

const STATUS_STYLE = {
  Active: { bg: "#dcfce7", color: "#166534" },
  Completed: { bg: "#e0e7ff", color: "#3730a3" },
  "On Hold": { bg: "#fef9c3", color: "#854d0e" },
  "Review Needed": { bg: "#fee2e2", color: "#991b1b" },
};

const TABS = ["Overview", "Financial", "Construction Progress", "Inventory"];

const TYPE_STYLE = {
  Materials: { bg: "#e0e7ff", color: "#3730a3" },
  Wages: { bg: "#dcfce7", color: "#166534" },
  Equipment: { bg: "#f3e8ff", color: "#7c3aed" },
  Income: { bg: "#d1fae5", color: "#065f46" },
  Expense: { bg: "#fef3c7", color: "#92400e" },
};

const PAYMENT_STYLE = {
  Paid: { bg: "#dcfce7", color: "#166534" },
  Unpaid: { bg: "#fee2e2", color: "#991b1b" },
  Partial: { bg: "#fef9c3", color: "#854d0e" },
};

const APPROVAL_STYLE = {
  Approved: { bg: "#dcfce7", color: "#166534" },
  Pending: { bg: "#fef9c3", color: "#854d0e" },
  Rejected: { bg: "#fee2e2", color: "#991b1b" },
};

function projectInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "🏗️";
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

const fmtINR = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [txStats, setTxStats] = useState({});
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [confirmDlg, setConfirmDlg] = useState(null);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await projectAPI.getById(id);
        setProject(data.project);
        const { data: txData } = await projectAPI.getStats(id).catch(() => ({ data: {} }));
        setTxStats(txData);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    transactionAPI.getAll({ project: id }).then(({ data }) => setTransactions(data.transactions || [])).catch(() => {});
    inventoryAPI.getAll().then(({ data }) => {
      const items = (data.inventory || []).filter(i => i.project?._id === id || i.project === id);
      setInventory(items);
    }).catch(() => {});
  }, [id]);

  const handleDelete = () => {
    setConfirmDlg({
      message: `Delete "${project.projectName}"? This action cannot be undone.`,
      danger: true,
      confirmLabel: "Delete Project",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await projectAPI.delete(id);
          setToast({ msg: `"${project.projectName}" deleted successfully.`, type: "success" });
          setTimeout(() => navigate("/projects", { replace: true }), 600);
        } catch (err) {
          setToast({ msg: err.response?.data?.message || "Failed to delete project.", type: "error" });
        }
      },
    });
  };

  const handleToggleActivity = async (phaseId, activityId) => {
    const phases = project.selectedPhases || [];
    const updatedPhases = toggleActivity(phases, phaseId, activityId);
    const newProgress = calcProgress(updatedPhases);
    setProject(prev => ({ ...prev, selectedPhases: updatedPhases, progress: newProgress }));
    try {
      await projectAPI.update(id, { selectedPhases: updatedPhases, progress: newProgress });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed to update progress.", type: "error" });
      setProject(prev => ({ ...prev, selectedPhases: phases, progress: calcProgress(phases) }));
    }
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#aaa", fontSize: 14 }}>Loading project…</div>;
  if (error) return <div style={{ padding: 48, textAlign: "center", color: "#dc2626", fontSize: 14 }}>⚠️ {error}</div>;
  if (!project) return null;

  const st = STATUS_STYLE[project.status] || STATUS_STYLE["Active"];
  const hasPhoto = Boolean(project.photo && String(project.photo).trim());
  const imgSrc = hasPhoto ? resolveImageUrl(project.photo) : "";
  const phases = project.selectedPhases || [];
  const totalSpent = txStats.totalSpent || transactions.filter(t => t.type !== "Income").reduce((s, t) => s + (t.amount || 0), 0);
  const materialSpend = txStats.materialSpend || transactions.filter(t => t.type === "Materials").reduce((s, t) => s + (t.amount || 0), 0);
  const labourSpend = txStats.labourSpend || transactions.filter(t => t.type === "Wages").reduce((s, t) => s + (t.amount || 0), 0);
  const equipmentSpend = txStats.equipmentSpend || transactions.filter(t => t.type === "Equipment" || t.type === "Expense").reduce((s, t) => s + (t.amount || 0), 0);
  const budget = Number(project.budget) || 0;
  const remaining = budget - totalSpent;

  const cardStyle = { background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" };
  const valueStyle = { fontSize: 14, fontWeight: 600, color: "#1a1a1a" };
  const sectionHeader = { fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 };

  const renderOverviewTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={cardStyle}>
          <div style={sectionHeader}>Project Information</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={labelStyle}>PROJECT NAME</div>
              <div style={valueStyle}>{project.projectName}</div>
            </div>
            {project.projectCode && (
              <div>
                <div style={labelStyle}>PROJECT CODE</div>
                <div style={valueStyle}>{project.projectCode}</div>
              </div>
            )}
            <div>
              <div style={labelStyle}>LOCATION</div>
              <div style={valueStyle}>{project.location || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>MANAGER</div>
              <div style={valueStyle}>{project.manager || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>CLIENT</div>
              <div style={valueStyle}>{project.client || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>CONTRACTOR</div>
              <div style={valueStyle}>{project.contractor || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>ENGINEER</div>
              <div style={valueStyle}>{project.engineer || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>CONTACT</div>
              <div style={valueStyle}>{project.contact || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>SCOPE</div>
              <div style={{ ...valueStyle, fontWeight: 400, lineHeight: 1.6 }}>{project.scope || "—"}</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionHeader}>Building Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={labelStyle}>BUILDING TYPE</div>
              <div style={valueStyle}>{project.buildingType || "—"}</div>
            </div>
            {project.floors && project.floors.length > 0 && (
              <div>
                <div style={labelStyle}>FLOORS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {project.floors.map((f, i) => (
                    <span key={i} style={{ padding: "4px 12px", borderRadius: 20, background: "#f5f5f5", border: "1px solid #e5e5e5", fontSize: 12, fontWeight: 600, color: "#555" }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            {project.landArea && (
              <div>
                <div style={labelStyle}>LAND AREA</div>
                <div style={valueStyle}>{project.landArea}</div>
              </div>
            )}
            {project.rooms && Object.keys(project.rooms).length > 0 && (
              <div>
                <div style={labelStyle}>ROOMS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {Object.entries(project.rooms).map(([key, val]) => (
                    <span key={key} style={{ padding: "4px 12px", borderRadius: 20, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12, fontWeight: 600, color: "#ea580c" }}>{key}: {val}</span>
                  ))}
                </div>
              </div>
            )}
            {project.bathrooms && (
              <div>
                <div style={labelStyle}>BATHROOMS</div>
                <div style={valueStyle}>{project.bathrooms}</div>
              </div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionHeader}>Timeline</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={labelStyle}>START DATE</div>
              <div style={valueStyle}>{project.startDate ? new Date(project.startDate).toLocaleDateString("en-IN") : "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>EXPECTED END DATE</div>
              <div style={valueStyle}>{project.endDate ? new Date(project.endDate).toLocaleDateString("en-IN") : "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>STATUS</div>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color, letterSpacing: "0.04em" }}>
                {project.status}
              </span>
            </div>
            <div>
              <div style={labelStyle}>CREATED</div>
              <div style={valueStyle}>{project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-IN") : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={cardStyle}>
          <div style={sectionHeader}>Financial Summary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px" }}>
                <div style={labelStyle}>TOTAL BUDGET</div>
                <div style={{ ...valueStyle, fontSize: 16, fontWeight: 700 }}>{fmtINR(budget)}</div>
              </div>
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px" }}>
                <div style={labelStyle}>SPENT</div>
                <div style={{ ...valueStyle, fontSize: 16, fontWeight: 700, color: "#dc2626" }}>{fmtINR(totalSpent)}</div>
              </div>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "14px 16px" }}>
              <div style={labelStyle}>REMAINING</div>
              <div style={{ ...valueStyle, fontSize: 16, fontWeight: 700, color: remaining >= 0 ? "#166534" : "#dc2626" }}>{fmtINR(remaining)}</div>
            </div>
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>BREAKDOWN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Material</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#3730a3" }}>{fmtINR(materialSpend)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${budget ? Math.min((materialSpend / budget) * 100, 100) : 0}%`, height: "100%", background: "#3730a3", borderRadius: 4 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Labour</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>{fmtINR(labourSpend)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${budget ? Math.min((labourSpend / budget) * 100, 100) : 0}%`, height: "100%", background: "#166534", borderRadius: 4 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Equipment</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{fmtINR(equipmentSpend)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${budget ? Math.min((equipmentSpend / budget) * 100, 100) : 0}%`, height: "100%", background: "#7c3aed", borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionHeader}>Quick Stats</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{transactions.length}</div>
              <div style={{ ...labelStyle, marginTop: 4 }}>ENTRIES</div>
            </div>
            <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>{transactions.filter(t => t.status === "Pending").length}</div>
              <div style={{ ...labelStyle, marginTop: 4 }}>PENDING</div>
            </div>
            <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#ea580c" }}>{project.progress || 0}%</div>
              <div style={{ ...labelStyle, marginTop: 4 }}>COMPLETE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialTab = () => (
    <div style={cardStyle}>
      {transactions.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
          <div style={{ fontSize: 13 }}>Transactions for this project will appear here.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
                {["DATE", "TITLE", "TYPE", "AMOUNT", "STATUS", "PAYMENT"].map(col => (
                  <th key={col} style={{ padding: "14px 18px", textAlign: col === "AMOUNT" ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => {
                const typeS = TYPE_STYLE[t.type] || { bg: "#f5f5f5", color: "#555" };
                const statusS = APPROVAL_STYLE[t.approvalStatus || t.status] || APPROVAL_STYLE["Pending"];
                const paymentS = PAYMENT_STYLE[t.paymentStatus] || PAYMENT_STYLE["Unpaid"];
                return (
                  <tr key={t._id} style={{ borderBottom: "1px solid #f5f5f5", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>{new Date(t.date).toLocaleDateString("en-IN")}</td>
                    <td style={{ padding: "14px 18px", fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{t.title}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: typeS.bg, color: typeS.color }}>{t.type === "Wages" ? "Labour" : t.type === "Expense" ? "Equipment" : t.type}</span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right", fontSize: 14, fontWeight: 700, color: t.type === "Income" ? "#16a34a" : "#dc2626" }}>
                      {t.type === "Income" ? "+" : "-"}{(t.amount ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: statusS.bg, color: statusS.color }}>{t.approvalStatus || t.status || "Pending"}</span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: paymentS.bg, color: paymentS.color }}>{t.paymentStatus || "Unpaid"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderConstructionTab = () => {
    if (phases.length === 0) {
      return (
        <div style={cardStyle}>
          <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No construction phases configured</div>
            <div style={{ fontSize: 13 }}>Construction phases will appear here once configured.</div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {phases.map((phase) => {
          const phaseProgress = getPhaseProgress(phase);
          const completedCount = phase.activities.filter(a => a.completed).length;
          const totalCount = phase.activities.length;
          const isExpanded = expandedPhase === phase.id;

          return (
            <div key={phase.id} style={cardStyle}>
              <div
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ fontSize: 16, color: "#aaa", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{phase.phaseName}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>{completedCount}/{totalCount}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${phaseProgress}%`, height: "100%", background: phaseProgress === 100 ? "#16a34a" : "#ea580c", borderRadius: 4, transition: "width 0.3s ease" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: phaseProgress === 100 ? "#16a34a" : "#ea580c", minWidth: 36, textAlign: "right" }}>{phaseProgress}%</span>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                  {phase.activities.map((activity) => {
                    const hasBudget = (activity.budgetMaterial || 0) + (activity.budgetLabour || 0) + (activity.budgetEquipment || 0) > 0;
                    return (
                      <div key={activity.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f9f9f9" }}>
                        <input
                          type="checkbox"
                          checked={activity.completed}
                          onChange={() => handleToggleActivity(phase.id, activity.id)}
                          style={{ width: 18, height: 18, accentColor: "#ea580c", cursor: "pointer", flexShrink: 0 }}
                        />
                        <span style={{ flex: 1, fontSize: 14, color: activity.completed ? "#aaa" : "#1a1a1a", textDecoration: activity.completed ? "line-through" : "none", fontWeight: 500 }}>
                          {activity.name}
                        </span>
                        {hasBudget && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#888", whiteSpace: "nowrap" }}>
                            {fmtINR((activity.budgetMaterial || 0) + (activity.budgetLabour || 0) + (activity.budgetEquipment || 0))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInventoryTab = () => (
    <div style={cardStyle}>
      {inventory.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No inventory items</div>
          <div style={{ fontSize: 13 }}>Inventory items for this project will appear here.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
                {["MATERIAL", "CATEGORY", "PURCHASED", "USED", "CLOSING STOCK", "THRESHOLD"].map(col => (
                  <th key={col} style={{ padding: "14px 18px", textAlign: col === "MATERIAL" || col === "CATEGORY" ? "left" : "right", fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => {
                const threshold = item.threshold || 5;
                const closingStock = item.closingStock || 0;
                const stockColor = closingStock <= 0 ? "#dc2626" : closingStock <= threshold ? "#d97706" : "#16a34a";
                return (
                  <tr key={item._id} style={{ borderBottom: "1px solid #f5f5f5", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{item.materialName}</div>
                      {item.unit && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>({item.unit})</div>}
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: "#555" }}>{item.category || "—"}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, color: "#1a1a1a" }}>{(item.purchased || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, color: "#dc2626" }}>{(item.used || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right", fontWeight: 800, fontSize: 14, color: stockColor }}>{closingStock.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right", fontSize: 13, color: "#888" }}>{threshold}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8" }}>
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

      <div style={{ height: 65, flexShrink: 0, background: "#fff", borderBottom: "1px solid #ebebeb", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <button onClick={() => navigate("/projects")} style={{ padding: "9px 18px", background: "#fff", color: "#555", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}>← Back to Projects</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.projectName}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => navigate("/newproject", { state: { editProject: project } })} style={{ padding: "9px 16px", background: "#fff", color: "#555", border: "1px solid #e5e5e5", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>✏️ Edit</button>
          <button onClick={handleDelete} style={{ padding: "9px 16px", background: "#fff5f5", color: "#dc2626", border: "1px solid #fee2e2", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>🗑️ Delete</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px 24px 60px", display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {hasPhoto ? (
              <img src={imgSrc} alt={project.projectName} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "#2a2a2a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {projectInitials(project.projectName)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{project.status}</span>
                {project.location && <span style={{ fontSize: 12, color: "#aaa" }}>📍 {project.location}</span>}
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 4 }}>
                {project.startDate && <span style={{ fontSize: 12, color: "#888" }}>📅 {new Date(project.startDate).toLocaleDateString("en-IN")}</span>}
                {budget > 0 && <span style={{ fontSize: 12, color: "#888" }}>💰 {fmtINR(budget)}</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 140 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>{project.progress || 0}%</span>
              <div style={{ width: "100%", height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${project.progress || 0}%`, height: "100%", background: "#ea580c", borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", borderRadius: 16, padding: "0 8px", display: "flex", gap: 4, flexShrink: 0, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t.toLowerCase())} style={{ padding: "14px 4px", marginRight: 16, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === t.toLowerCase() ? 600 : 400, color: activeTab === t.toLowerCase() ? "#ea580c" : "#777", borderBottom: activeTab === t.toLowerCase() ? "2.5px solid #ea580c" : "2.5px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap" }}>
              {t}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "financial" && renderFinancialTab()}
          {activeTab === "construction progress" && renderConstructionTab()}
          {activeTab === "inventory" && renderInventoryTab()}
        </div>
      </div>
    </div>
  );
}
