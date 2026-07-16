import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { projectAPI, transactionAPI } from "../api";
import { resolveImageUrl } from "../utils/imageUrl";
import { calcProgress, getPhaseProgress, toggleActivity } from "../utils/constructionPhases";
import { Toast, ConfirmDialog } from "../components/Toast";

const SECTIONS = {
  projectInfo: "Project Information",
  buildingType: "Building Type",
  landFloors: "Land & Floor Configuration",
  roomsBaths: "Rooms & Bathrooms",
  addlConfig: "Additional Configuration",
  utility: "Utility & Services",
  gas: "Gas Connection",
  kitchen: "Kitchen Requirements",
  electrical: "Electrical & Plumbing",
  terrace: "Terrace & Interior",
  timeline: "Timeline & Status",
  financial: "Financial Overview",
  tracker: "Execution Tracker",
  entries: "Recent Activity",
  actions: "Actions",
};

const STATUS_STYLE = {
  Active: { bg: "#dcfce7", color: "#166534" },
  Completed: { bg: "#e0e7ff", color: "#3730a3" },
  "On Hold": { bg: "#fef9c3", color: "#854d0e" },
  "Review Needed": { bg: "#fee2e2", color: "#991b1b" },
  Planning: { bg: "#FFF8E1", border: "#FFC107", text: "#F57F17" },
  "In Progress": { bg: "#E8F0FE", border: "#4A6CF7", text: "#3D5AFE" },
  Cancelled: { bg: "#FFEBEE", border: "#E53935", text: "#C62828" },
};

const _kAddlConfig = [
  "Balcony", "Car Parking", "Lift", "Terrace Access", "Interior Work",
  "Compound Wall", "Parapet Wall", "Waterproofing", "Putty", "False Ceiling",
  "Modular Kitchen", "Wardrobes", "Sump", "Septic Tank", "Rainwater",
  "Borewell", "Solar", "Generator", "CCTV", "Intercom",
  "Landscaping", "Paving", "Water Tanks", "Stairs", "Security Room",
  "Cladding", "Elevation", "Gates", "Grills", "Aluminium", "Glass",
];
const _kUtility = ["Main Electricity", "Temporary Connection", "Generator Backup", "Water Connection", "Borewell Motor", "Sump Motor"];
const _kGas = ["Piped Gas", "Cylinder Bank", "Gas Pipeline Routing"];
const _kKitchen = ["Granite Counter", "Quartz Counter", "Stainless Steel Sink", "Chimney Provision", "Exhaust Fan Provision"];
const _kElectrical = ["Concealed Wiring", "Open Wiring", "3-Phase Connection", "AC Points", "Geyser Points"];
const _kTerrace = ["Weathering Course", "Cool Roof Paint", "Overhead Tank", "Solar Panels"];

const _grp = (all, opts) => all.filter(f => opts.includes(f));
const _months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const _fmtDate = (d) => d ? `${d.getDate()} ${_months[d.getMonth()]} ${d.getFullYear()}` : "—";
const fmtINR = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
const _statusColor = (s) => {
  if (s === "Completed") return "#16a34a";
  if (s === "In Progress") return "#6C63FF";
  if (s === "On Hold") return "#f59e0b";
  if (s === "Cancelled") return "#ef4444";
  return "#6B7280";
};

function projectInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "🏗️";
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

function CollapsibleCard({ title, icon, defaultOpen = true, count, subtitle, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEF0F5", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
        {icon && <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{title}</span>
          {(count !== undefined || subtitle) && (
            <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>
              {count !== undefined ? `(${count})` : subtitle}
            </span>
          )}
        </div>
        <span style={{ color: "#9CA3AF", fontSize: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▾</span>
      </div>
      {open && <div style={{ padding: "0 20px 16px" }}>{children}</div>}
    </div>
  );
}

export default function ManageSitePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const project = location.state?.project || null;
  const projectId = project?._id || project?.id;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loadingT, setLoadingT] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedActivityBudgets, setExpandedActivityBudgets] = useState({});
  const [localProject, setLocalProject] = useState(project);
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoadingStats(true);
    Promise.all([
      projectAPI.getStats(projectId).then(({ data }) => setStats(data)).catch(() => setStats(null)),
      projectAPI.getById(projectId).then(({ data }) => {
        if (data.project) setLocalProject(data.project);
      }).catch(() => {}),
    ]).finally(() => setLoadingStats(false));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setLoadingT(true);
    transactionAPI.getAll({ project: projectId })
      .then(({ data }) => setTransactions((data.transactions || []).slice(0, 5)))
      .catch(() => setTransactions([]))
      .finally(() => setLoadingT(false));
  }, [projectId]);

  if (!project) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Segoe UI', sans-serif", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🏗️</div>
        <h2 style={{ margin: 0, color: "#1a1a1a" }}>No project selected</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Please select a project from the projects list.</p>
        <button onClick={() => navigate("/projects")} style={{ padding: "12px 24px", background: "#6C63FF", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(108,99,255,0.3)" }}>
          ← Go to Projects
        </button>
      </div>
    );
  }

  const p = localProject || project;
  const projectName = p.projectName || "Untitled Project";
  const projectLoc = p.location || "—";
  const progress = p.progress || 0;
  const status = p.status || "Active";
  const st = STATUS_STYLE[status] || STATUS_STYLE.Active;
  const hasPhoto = Boolean(p.photo && String(p.photo).trim());
  const imgSrc = hasPhoto ? resolveImageUrl(p.photo) : "";

  const totalBudget = Number(p.totalBudget || p.budget || stats?.totalBudget || 0);
  const spent = Number(p.spentAmount || stats?.totalSpent || 0);
  const remaining = totalBudget - spent;
  const util = totalBudget > 0 ? Math.min(spent / totalBudget, 1) : 0;

  const bMat = Number(p.budgetMaterial || 0);
  const bLab = Number(p.budgetLabour || 0);
  const bEq = Number(p.budgetEquipment || 0);
  const bMisc = Number(p.budgetMisc || 0);
  const hasBrk = bMat + bLab + bEq + bMisc > 0;

  const phases = p.selectedPhases || [];
  const hasNewTracker = phases.length > 0;
  const trackerTotal = phases.reduce((s, ph) => s + (ph.activities?.length || 0), 0);
  const trackerDone = phases.reduce((s, ph) => s + (ph.activities?.filter(a => a.completed).length || 0), 0);

  const selectedFeatures = p.selectedFeatures || [];
  const addl = _grp(selectedFeatures, _kAddlConfig);
  const utility = _grp(selectedFeatures, _kUtility);
  const gas = _grp(selectedFeatures, _kGas);
  const kitchen = _grp(selectedFeatures, _kKitchen);
  const electrical = _grp(selectedFeatures, _kElectrical);
  const terrace = _grp(selectedFeatures, _kTerrace);
  const allKnown = [..._kAddlConfig, ..._kUtility, ..._kGas, ..._kKitchen, ..._kElectrical, ..._kTerrace];
  const unknown = selectedFeatures.filter(f => !allKnown.includes(f));
  const addlAll = [...addl, ...unknown];

  const handleToggleActivity = async (phaseId, activityId) => {
    const updatedPhases = toggleActivity(phases, phaseId, activityId);
    const newProgress = calcProgress(updatedPhases);
    setLocalProject(prev => ({ ...prev, selectedPhases: updatedPhases, progress: newProgress }));
    try {
      await projectAPI.update(projectId, { selectedPhases: updatedPhases, progress: newProgress });
    } catch {
      setLocalProject(prev => ({ ...prev, selectedPhases: phases, progress: calcProgress(phases) }));
      setToast({ msg: "Failed to update activity.", type: "error" });
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await projectAPI.getStats(projectId);
      const rows = [["Category", "Amount", "Date", "Type"]];
      (data.transactions || []).forEach(t => {
        rows.push([t.category || "", t.amount || 0, t.date || "", t.type || ""]);
      });
      let csv = rows.map(r => r.join(",")).join("\n");
      const BOM = "\uFEFF";
      csv = BOM + csv;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ msg: "CSV exported successfully.", type: "success" });
    } catch {
      setToast({ msg: "Failed to export CSV.", type: "error" });
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const lines = text.split("\n").filter(l => l.trim());
        const parsed = lines.slice(1).map(line => {
          const cols = line.split(",");
          return { category: cols[0]?.trim(), amount: parseFloat(cols[1]) || 0, date: cols[2]?.trim(), type: cols[3]?.trim() };
        });
        await projectAPI.update(projectId, { importedTransactions: parsed });
        setToast({ msg: `Imported ${parsed.length} entries.`, type: "success" });
      } catch {
        setToast({ msg: "Failed to import CSV.", type: "error" });
      }
    };
    input.click();
  };

  const card = { background: "#fff", borderRadius: 16, border: "1px solid #EEF0F5", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" };
  const label = { fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", marginBottom: 2 };
  const value = { fontSize: 14, fontWeight: 600, color: "#1F2937" };
  const sectionHeader = { fontSize: 14, fontWeight: 700, color: "#1F2937", marginBottom: 12 };

  const renderProjectInfo = () => {
    const infoRows = [];
    if (p.projectCode) infoRows.push({ icon: "🔲", label: "Project Code", val: p.projectCode });
    if (p.clientName || p.client) infoRows.push({ icon: "👤", label: "Client", val: p.clientName || p.client });
    if (p.contractorName || p.contractor) infoRows.push({ icon: "🔧", label: "Contractor", val: p.contractorName || p.contractor });
    if (p.siteEngineer || p.engineer) infoRows.push({ icon: "👷", label: "Engineer", val: p.siteEngineer || p.engineer });
    if (p.contactNumber || p.contact) infoRows.push({ icon: "📞", label: "Contact", val: p.contactNumber || p.contact });
    if (p.mapAddress) infoRows.push({ icon: "📍", label: "Map Address", val: p.mapAddress });
    infoRows.push({ icon: "🏷️", label: "Status", val: status });
    infoRows.push({ icon: "📍", label: "Location", val: projectLoc });
    if (infoRows.length === 0) return null;
    return (
      <CollapsibleCard title={SECTIONS.projectInfo} icon="📋" defaultOpen>
        {infoRows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < infoRows.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(108,99,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{r.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={label}>{r.label}</div>
              <div style={{ ...value, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{r.val}</div>
            </div>
          </div>
        ))}
      </CollapsibleCard>
    );
  };

  const renderBuildingType = () => {
    const raw = p.projectType || "";
    if (!raw) return null;
    const parts = raw.split(" → ");
    const mainType = parts[0]?.trim() || raw;
    const subType = parts.length > 1 ? parts[1]?.trim() : null;
    const typeIcons = { Residential: "🏠", Educational: "🏫", Institutional: "🏛️", "Business / Commercial": "🏪", Industrial: "🏭" };
    const mainIcon = typeIcons[mainType] || "🏢";
    return (
      <CollapsibleCard title={SECTIONS.buildingType} icon={mainIcon} defaultOpen>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(108,99,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{mainIcon}</div>
          <div style={{ flex: 1 }}>
            <div style={label}>MAIN TYPE</div>
            <div style={{ ...value, fontWeight: 700 }}>{mainType}</div>
          </div>
          {subType && (
            <span style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", fontSize: 12, fontWeight: 700, color: "#6C63FF", flexShrink: 0 }}>{subType}</span>
          )}
        </div>
      </CollapsibleCard>
    );
  };

  const renderLandFloors = () => {
    const hasLand = p.landArea && String(p.landArea).trim();
    const floors = p.floors || [];
    if (!hasLand && floors.length === 0) return null;
    return (
      <CollapsibleCard title={SECTIONS.landFloors} icon="🏞️" defaultOpen>
        {hasLand && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: floors.length > 0 ? 14 : 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(108,99,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🌳</div>
            <div style={{ flex: 1 }}>
              <div style={label}>TOTAL LAND AREA</div>
              <div style={{ ...value, fontWeight: 700 }}>{p.landArea} {p.landUnit || ""}</div>
            </div>
          </div>
        )}
        {floors.length > 0 && (
          <>
            <div style={label}>FLOORS INCLUDED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {floors.map((f, i) => (
                <span key={i} style={{ padding: "5px 12px", borderRadius: 20, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", fontSize: 12, fontWeight: 700, color: "#6C63FF" }}>{f}</span>
              ))}
            </div>
          </>
        )}
      </CollapsibleCard>
    );
  };

  const renderRoomsBaths = () => {
    const rooms = { "1 BHK": p.room1BHK, "2 BHK": p.room2BHK, "3 BHK": p.room3BHK, Custom: p.roomCustom };
    const baths = { Western: p.bathWestern, Indian: p.bathIndian, Common: p.bathCommon, Attached: p.bathAttached };
    const hasRoom = Object.values(rooms).some(v => (v || 0) > 0);
    const hasBath = Object.values(baths).some(v => (v || 0) > 0);
    if (!hasRoom && !hasBath) return null;
    const pill = (label, count, color) => (
      <span style={{ padding: "6px 14px", borderRadius: 12, background: `${color}10`, border: `1px solid ${color}26`, fontSize: 13, fontWeight: 700, color, display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label} <span style={{ fontSize: 16 }}>{count || 0}</span>
      </span>
    );
    return (
      <CollapsibleCard title={SECTIONS.roomsBaths} icon="🛏️" defaultOpen>
        {hasRoom && (
          <>
            <div style={label}>ROOMS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, marginBottom: hasBath ? 14 : 0 }}>
              {Object.entries(rooms).filter(([, v]) => (v || 0) > 0).map(([k, v]) => (
                <span key={k}>{pill(k, v, "#6C63FF")}</span>
              ))}
            </div>
          </>
        )}
        {hasBath && (
          <>
            <div style={label}>BATHROOMS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {Object.entries(baths).filter(([, v]) => (v || 0) > 0).map(([k, v]) => (
                <span key={k}>{pill(k, v, "#00838F")}</span>
              ))}
            </div>
          </>
        )}
      </CollapsibleCard>
    );
  };

  const renderFeatureGroup = (title, icon, items) => {
    if (items.length === 0) return null;
    return (
      <CollapsibleCard title={title} icon={icon} defaultOpen count={items.length}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map((f, i) => (
            <span key={i} style={{ padding: "5px 10px", borderRadius: 20, background: "rgba(108,99,255,0.07)", border: "1px solid rgba(108,99,255,0.18)", fontSize: 11, fontWeight: 700, color: "#6C63FF" }}>{f}</span>
          ))}
        </div>
      </CollapsibleCard>
    );
  };

  const renderTimeline = () => {
    const statusColor = _statusColor(status);
    const startDate = p.startDate ? new Date(p.startDate) : null;
    const expectedEnd = p.expectedEndDate ? new Date(p.expectedEndDate) : (p.endDate ? new Date(p.endDate) : null);
    const actualEnd = p.actualEndDate ? new Date(p.actualEndDate) : null;
    return (
      <CollapsibleCard title={SECTIONS.timeline} icon="📅" defaultOpen>
        {status && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${statusColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏷️</div>
            <span style={{ flex: 1, fontSize: 13, color: "#4B5563" }}>Project Status</span>
            <span style={{ padding: "5px 12px", borderRadius: 20, background: `${statusColor}18`, fontSize: 12, fontWeight: 700, color: statusColor }}>{status}</span>
          </div>
        )}
        <div style={label}>PROJECT TIMELINE</div>
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <DateBox label="Start Date" val={startDate ? _fmtDate(startDate) : "—"} icon="▶️" color="#6C63FF" />
          {expectedEnd && <DateBox label="Expected End" val={_fmtDate(expectedEnd)} icon="📅" color="#f59e0b" />}
          {actualEnd && <DateBox label="Actual End Date" val={_fmtDate(actualEnd)} icon="✅" color="#16a34a" />}
        </div>
      </CollapsibleCard>
    );
  };

  const renderFinancial = () => (
    <CollapsibleCard title={SECTIONS.financial} icon="💰" defaultOpen>
      <div style={{ background: "rgba(108,99,255,0.06)", borderRadius: 12, border: "1px solid rgba(108,99,255,0.15)", padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(108,99,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💳</div>
          <div style={{ flex: 1 }}>
            <div style={label}>TOTAL BUDGET</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#6C63FF", letterSpacing: "-0.3px" }}>{fmtINR(totalBudget)}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${spent > totalBudget ? "#ef4444" : "#6C63FF"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>💸</div>
        <span style={{ flex: 1, fontSize: 13, color: "#4B5563" }}>Spent Amount</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: spent > totalBudget ? "#ef4444" : "#6C63FF" }}>{fmtINR(Math.max(spent, 0))}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${remaining >= 0 ? "#16a34a" : "#ef4444"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏦</div>
        <span style={{ flex: 1, fontSize: 13, color: "#4B5563" }}>Remaining</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: remaining >= 0 ? "#16a34a" : "#ef4444" }}>{fmtINR(Math.max(remaining, 0))}</span>
      </div>
      {hasBrk && (
        <>
          <div style={{ height: 1, background: "#EEF0F8", margin: "10px 0" }} />
          <div style={label}>BUDGET BREAKDOWN</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {bMat > 0 && <CatRow label="Material" amount={bMat} color="#6C63FF" icon="📦" />}
            {bLab > 0 && <CatRow label="Labour" amount={bLab} color="#0ea5e9" icon="👥" />}
            {bEq > 0 && <CatRow label="Equipment" amount={bEq} color="#7c3aed" icon="⚙️" />}
            {bMisc > 0 && <CatRow label="Miscellaneous" amount={bMisc} color="#f59e0b" icon="📎" />}
          </div>
        </>
      )}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ ...label, fontSize: 11 }}>Budget Used</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: util >= 1 ? "#ef4444" : util >= 0.8 ? "#f59e0b" : "#6C63FF" }}>{Math.round(util * 100)}%</span>
        </div>
        <div style={{ height: 8, background: "#EEF0F8", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(util * 100, 100)}%`, height: "100%", borderRadius: 16, background: util >= 1 ? "#ef4444" : util >= 0.8 ? "#f59e0b" : "#6C63FF", transition: "width 0.4s ease" }} />
        </div>
      </div>
    </CollapsibleCard>
  );

  const renderTracker = () => {
    if (!hasNewTracker) {
      return (
        <CollapsibleCard title={SECTIONS.tracker} icon="✅" defaultOpen>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, color: "#CDD0DA", marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#9CA3AF" }}>No execution plan configured</div>
            <div style={{ fontSize: 12, color: "#B0B3BE", marginTop: 4 }}>Select phases & activities when creating a project.</div>
          </div>
        </CollapsibleCard>
      );
    }
    return (
      <CollapsibleCard title={SECTIONS.tracker} icon="✅" subtitle={`${trackerDone}/${trackerTotal} done`} defaultOpen>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {phases.map(phase => {
            const pDone = phase.activities?.filter(a => a.completed).length || 0;
            const pTotal = phase.activities?.length || 0;
            const pPct = pTotal > 0 ? pDone / pTotal : 0;
            const isExpanded = expandedPhase === phase.id;
            return (
              <div key={phase.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEF0F5", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.02)" }}>
                <div onClick={() => setExpandedPhase(isExpanded ? null : phase.id)} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: phase.isCustom ? "rgba(123,63,231,0.10)" : "rgba(108,99,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {phase.isCustom ? "⭐" : "🔨"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{phase.phaseName}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>{pDone} of {pTotal} activities done</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: pPct >= 1 ? "#16a34a" : "#6C63FF" }}>{Math.round(pPct * 100)}%</div>
                    <div style={{ fontSize: 14, color: "#9CA3AF", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>▾</div>
                  </div>
                </div>
                {pTotal > 0 && (
                  <div style={{ padding: "0 16px 8px" }}>
                    <div style={{ height: 3, background: "#EEF0F8", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pPct * 100}%`, height: "100%", background: pPct >= 1 ? "#16a34a" : "#6C63FF", borderRadius: 8, transition: "width 0.3s" }} />
                    </div>
                  </div>
                )}
                {isExpanded && phase.activities?.map(act => {
                  const actBud = (act.budgetMaterial || 0) + (act.budgetLabour || 0) + (act.budgetEquipment || 0);
                  const isBudgetExpanded = expandedActivityBudgets[act.id];
                  return (
                    <div key={act.id}>
                      <div style={{ padding: "8px 16px 8px 20px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #F3F4F6", cursor: "pointer" }}
                        onClick={() => setExpandedActivityBudgets(prev => ({ ...prev, [act.id]: !prev[act.id] }))}>
                        <div onClick={e => { e.stopPropagation(); handleToggleActivity(phase.id, act.id); }}
                          style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${act.completed ? "#16a34a" : "#CDD0DA"}`, background: act.completed ? "#16a34a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.18s" }}>
                          {act.completed && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: act.completed ? 600 : 500, color: act.completed ? "#9CA3AF" : "#1F2937", textDecoration: act.completed ? "line-through" : "none" }}>
                          {act.name}
                        </span>
                        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: act.completed ? "rgba(22,163,74,0.10)" : "#FFF3CD", color: act.completed ? "#16a34a" : "#f59e0b" }}>
                          {act.completed ? "Done" : "Pending"}
                        </span>
                        <span style={{ color: "#9CA3AF", fontSize: 12, transform: isBudgetExpanded ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>▾</span>
                      </div>
                      {isBudgetExpanded && actBud > 0 && (
                        <div style={{ margin: "0 16px 12px", padding: 14, background: "#F7F8FC", borderRadius: 12, border: "1px solid #EEF0F6" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1F2937" }}>Activity Budget</span>
                          </div>
                          {act.budgetMaterial > 0 && <BudgetRow label="Materials" allocated={act.budgetMaterial} spent={0} color="#6C63FF" />}
                          {act.budgetLabour > 0 && <BudgetRow label="Labour" allocated={act.budgetLabour} spent={0} color="#10B981" />}
                          {act.budgetEquipment > 0 && <BudgetRow label="Equipment" allocated={act.budgetEquipment} spent={0} color="#f59e0b" />}
                          <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />
                          <BudgetRow label="Total Budget" allocated={actBud} spent={0} color="#7c3aed" bold />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </CollapsibleCard>
    );
  };

  const renderRecentEntries = () => (
    <CollapsibleCard title={SECTIONS.entries} icon="📄" defaultOpen>
      {loadingT ? (
        <div style={{ color: "#aaa", fontSize: 13, padding: 16, textAlign: "center" }}>Loading activity…</div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF" }}>
          <div style={{ fontSize: 32, marginBottom: 8, color: "#CDD0DA" }}>📄</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>No entries logged yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {transactions.map((t, i) => {
            const typeIcon = t.type === "Income" ? "💰" : t.type === "Wages" ? "👷" : t.type === "Expense" ? "📦" : t.type === "Materials" ? "🧱" : "📋";
            const typeBg = t.type === "Income" ? "#dcfce7" : t.type === "Wages" ? "#dbeafe" : t.type === "Expense" ? "#fef9c3" : t.type === "Materials" ? "#f3e8ff" : "#f5f5f5";
            return (
              <div key={t._id || i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: typeBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{typeIcon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{t.title || (t.type === "Wages" ? "Labour" : t.type === "Expense" ? "Equipment" : t.type)}</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                    {t.type === "Income" ? "+" : "−"}{t.amount?.toLocaleString("en-IN")}
                    {t.worker ? ` · ${typeof t.worker === "string" ? t.worker : t.worker.name || ""}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleCard>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8" }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && <ConfirmDialog message={confirmDlg.message} danger={confirmDlg.danger} confirmLabel={confirmDlg.confirmLabel} onConfirm={confirmDlg.onConfirm} onCancel={() => setConfirmDlg(null)} />}

      <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#888" }}>
          <span onClick={() => navigate("/projects")} style={{ color: "#6C63FF", cursor: "pointer", fontWeight: 500 }}>Projects</span>
          <span>›</span>
          <span style={{ color: "#1a1a1a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{projectName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleExportCSV} style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            📤 Export CSV
          </button>
          <button onClick={handleImportCSV} style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            📥 Import CSV
          </button>
          <button onClick={() => navigate("/newproject", { state: { editProject: p } })} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ✏️ Edit
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Summary Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EEF0F5", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: 20, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1F2937", letterSpacing: "-0.3px" }}>{projectName}</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                <span style={{ padding: "4px 10px", borderRadius: 20, background: `${_statusColor(status)}12`, fontSize: 11, fontWeight: 700, color: _statusColor(status) }}>{status}</span>
                {phases.length > 0 && (() => {
                  const completedKeys = new Set(phases.flatMap(ph => ph.activities?.filter(a => a.completed).map(a => a.id) || []));
                  let activePhase = null;
                  for (const ph of phases) {
                    if (ph.activities?.some(a => !completedKeys.has(a.id))) {
                      activePhase = ph.phaseName;
                      break;
                    }
                  }
                  return activePhase ? (
                    <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(108,99,255,0.07)", border: "1px solid rgba(108,99,255,0.25)", fontSize: 11, fontWeight: 700, color: "#6C63FF", display: "flex", alignItems: "center", gap: 4 }}>
                      ▶ {activePhase}
                    </span>
                  ) : null;
                })()}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", display: "flex", flexDirection: "column", gap: 2 }}>
                <span>📍 {projectLoc}</span>
                {p.startDate && <span>📅 Started {_fmtDate(new Date(p.startDate))}</span>}
                {p.expectedEndDate && <span>📅 Due {_fmtDate(new Date(p.expectedEndDate))}</span>}
                {p.clientName && <span>👤 {p.clientName}</span>}
                {p.projectCode && <span>🔲 {p.projectCode}</span>}
              </div>
              {p.floors && p.floors.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {p.floors.map((f, i) => (
                    <span key={i} style={{ padding: "3px 8px", borderRadius: 12, background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.15)", fontSize: 11, fontWeight: 700, color: "#6C63FF" }}>{f}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 8, minWidth: isMobile ? "100%" : 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>Overall Completion</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#6C63FF" }}>{(progress).toFixed(1)}% ({trackerDone}/{trackerTotal || progress > 0 ? "—" : 0} activities)</span>
              </div>
              <div style={{ width: "100%", height: 10, background: "#E8ECF8", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: _statusColor(status), borderRadius: 16, transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Information */}
        {renderProjectInfo()}

        {/* Building Type */}
        {renderBuildingType()}

        {/* Land & Floor Configuration */}
        {renderLandFloors()}

        {/* Rooms & Bathrooms */}
        {renderRoomsBaths()}

        {/* Feature Groups */}
        {renderFeatureGroup("Additional Configuration", "⚙️", addlAll)}
        {renderFeatureGroup("Utility & Services", "💡", utility)}
        {renderFeatureGroup("Gas Connection", "🔥", gas)}
        {renderFeatureGroup("Kitchen Requirements", "🍳", kitchen)}
        {renderFeatureGroup("Electrical & Plumbing", "⚡", electrical)}
        {renderFeatureGroup("Terrace & Interior", "🏗️", terrace)}

        {/* Timeline & Status */}
        {renderTimeline()}

        {/* Financial Overview */}
        {renderFinancial()}

        {/* Execution Tracker */}
        {renderTracker()}

        {/* Recent Entries */}
        {renderRecentEntries()}

        {/* Action Buttons */}
        <CollapsibleCard title="Actions" icon="⚡" defaultOpen>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            <ActionBtn icon="📝" label="Add Entry" onClick={() => navigate("/add-entry", { state: { project: p } })} borderColor="#ea580c" />
            <ActionBtn icon="🎤" label="Voice Entry" onClick={() => navigate("/voice", { state: { project: p } })} borderColor="#7c3aed" />
            <ActionBtn icon="📊" label="View Reports" onClick={() => navigate("/reports/:id", { state: { project: p } })} borderColor="#2563eb" />
            <ActionBtn icon="🏗️" label="Full Details" onClick={() => navigate("/project-detail/" + projectId, { state: { project: p } })} borderColor="#16a34a" />
          </div>
        </CollapsibleCard>

      </div>
    </div>
  );
}

function DateBox({ label, val, icon, color }) {
  return (
    <div style={{ flex: 1, minWidth: 120, padding: "8px 10px", background: `${color}0f`, borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, color: "#6B7280", fontWeight: 600, letterSpacing: "0.4px" }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{val}</div>
      </div>
    </div>
  );
}

function CatRow({ label, amount, color, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{icon}</div>
      <span style={{ flex: 1, fontSize: 13, color: "#4B5563" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmtINR(amount)}</span>
    </div>
  );
}

function BudgetRow({ label, allocated, spent, color, bold }) {
  const remaining = allocated - spent;
  const pct = allocated > 0 ? Math.min(spent / allocated, 1) : 0;
  const isOver = spent > allocated && allocated > 0;
  const barColor = isOver ? "#ef4444" : color;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: bold ? 700 : 500, color: bold ? "#1F2937" : "#4B5563" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: bold ? 700 : 600, color: isOver ? "#ef4444" : bold ? "#1F2937" : "#374151" }}>
          {fmtINR(spent)} / {fmtINR(allocated)}
        </span>
      </div>
      {!bold && (
        <>
          <div style={{ height: 4, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct * 100}%`, height: "100%", background: barColor, borderRadius: 4 }} />
          </div>
          {isOver && <div style={{ fontSize: 9.5, fontWeight: 600, color: "#ef4444", marginTop: 2 }}>Exceeded by {fmtINR(spent - allocated)}</div>}
          {!isOver && allocated > 0 && spent > 0 && <div style={{ fontSize: 9.5, fontWeight: 500, color: "#6B7280", marginTop: 2 }}>{fmtINR(remaining)} remaining</div>}
        </>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, borderColor }) {
  return (
    <button onClick={onClick} style={{ padding: "14px", background: "#fff", border: "1px solid #EEF0F5", borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.02)", transition: "border-color 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = borderColor}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#EEF0F5"}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>{label}</span>
    </button>
  );
}
