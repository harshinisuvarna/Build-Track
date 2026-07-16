import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { projectAPI, workerAPI } from "../api";
import { resolveImageUrl } from "../utils/imageUrl";
import { buildDefaultPhases, addCustomPhase, addActivityToPhase } from "../utils/constructionPhases";

const TOPBAR_H = 65;

const buildingTypes = {
  Residential: ["Select Sub Type", "1 BHK", "2 BHK", "3 BHK", "Villa", "Apartment", "Duplex", "Penthouse", "Other (Custom)"],
  Educational: ["Select Sub Type", "School", "College", "University", "Training Center", "Library", "Other (Custom)"],
  Institutional: ["Select Sub Type", "Hospital", "Clinic", "Community Center", "Government Office", "Other (Custom)"],
  "Business / Commercial": ["Select Sub Type", "Office", "Shopping Mall", "Restaurant", "Hotel", "Warehouse", "Showroom", "Other (Custom)"],
  Industrial: ["Select Sub Type", "Factory", "Manufacturing Plant", "Godown", "Processing Unit", "Other (Custom)"],
};

const floorOptions = ["Ground", "1st", "2nd", "3rd", "4th", "Terrace", "Head Room"];
const landUnits = ["Sq ft", "Sq m", "Acres", "Hectares"];

const additionalFeatures = [
  "Balcony", "Car Parking", "Lift", "Terrace Access", "Interior Work",
  "Compound Wall", "Parapet Wall", "Waterproofing", "Putty", "False Ceiling",
  "Modular Kitchen", "Wardrobes", "Sump", "Septic Tank", "Rainwater Harvesting",
  "Borewell", "Solar Panels", "Generator", "CCTV", "Intercom",
  "Landscaping", "Paving", "Water Tanks", "Stairs", "Security Room",
  "Cladding", "Elevation", "Gates", "Grills", "Aluminium Work", "Glass Work",
];

const utilityServices = [
  "Main Electricity", "Temporary Connection", "Generator Backup",
  "Water Connection", "Borewell Motor", "Sump Motor",
];

const gasConnections = ["Piped Gas", "Cylinder Bank", "Gas Pipeline Routing"];
const kitchenReqs = ["Granite Counter", "Quartz Counter", "Stainless Steel Sink", "Chimney Provision", "Exhaust Fan Provision"];
const electricalPlumbing = ["Concealed Wiring", "Open Wiring", "3-Phase Connection", "AC Points", "Geyser Points"];
const terraceInterior = ["Weathering Course", "Cool Roof Paint", "Overhead Tank", "Solar Panels"];

const defaultPhases = buildDefaultPhases();

const statusChips = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];

const statusColors = {
  Planning: { bg: "#FFF8E1", border: "#FFC107", text: "#F57F17" },
  "In Progress": { bg: "#E8F0FE", border: "#4A6CF7", text: "#3D5AFE" },
  "On Hold": { bg: "#FFF3E0", border: "#FF9800", text: "#E65100" },
  Completed: { bg: "#E8F5E9", border: "#43A047", text: "#2E7D32" },
  Cancelled: { bg: "#FFEBEE", border: "#E53935", text: "#C62828" },
};

function Accordion({ title, icon, defaultOpen, children, count, subtitle }) {
  const [open, setOpen] = useState(defaultOpen !== false);
  return (
    <div style={{ marginBottom: 16, background: "#fff", borderRadius: 16, border: "1px solid #E7E8F5", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{title}</span>
          {(count !== undefined || subtitle) && (
            <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 8 }}>
              {count !== undefined ? `(${count})` : subtitle}
            </span>
          )}
        </div>
        <span style={{ color: "#9CA3AF", fontSize: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </div>
      {open && <div style={{ padding: "0 20px 16px" }}>{children}</div>}
    </div>
  );
}

function ChipSelect({ options, selected, onChange, multi }) {
  const handleToggle = (opt) => {
    if (multi) {
      onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
    } else {
      onChange(opt);
    }
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const isOn = multi ? selected.includes(opt) : selected === opt;
        return (
          <div key={opt}
            onClick={() => handleToggle(opt)}
            style={{
              padding: "8px 16px", borderRadius: 24, fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: isOn ? "#6C63FF" : "#fff",
              color: isOn ? "#fff" : "#4B5563",
              border: `1.5px solid ${isOn ? "#6C63FF" : "#E7E8F5"}`,
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
}

function Stepper({ label, value, onChange, min = 0, max = 99 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E7E8F5", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
          −
        </button>
        <span style={{ width: 28, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#1F2937" }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E7E8F5", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
          +
        </button>
      </div>
    </div>
  );
}

function CheckboxGroup({ items, selected, onChange, columns = 2 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {items.map(item => {
        const isOn = selected.includes(item);
        return (
          <label key={item} onClick={() => onChange(isOn ? selected.filter(s => s !== item) : [...selected, item])}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#4B5563", userSelect: "none", background: isOn ? "#ECEBFF" : "transparent", transition: "background 0.15s" }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isOn ? "#6C63FF" : "#D1D5DB"}`, background: isOn ? "#6C63FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
              {isOn && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
            </div>
            {item}
          </label>
        );
      })}
    </div>
  );
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const editProject = location.state?.editProject || null;
  const isEditMode = Boolean(editProject);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [projectName, setProjectName] = useState("");
  const [city, setCity] = useState("");
  const [mapAddress, setMapAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [siteEngineer, setSiteEngineer] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [manager, setManager] = useState("");
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(true);
  const [mainType, setMainType] = useState("Residential");
  const [subType, setSubType] = useState("Select Sub Type");
  const [customSubType, setCustomSubType] = useState("");
  const [landArea, setLandArea] = useState("");
  const [landUnit, setLandUnit] = useState("Sq ft");
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [rooms, setRooms] = useState({ room1BHK: 0, room2BHK: 0, room3BHK: 0, roomCustom: 0 });
  const [bathrooms, setBathrooms] = useState({ bathWestern: 0, bathIndian: 0, bathCommon: 0, bathAttached: 0 });
  const [features, setFeatures] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [gas, setGas] = useState([]);
  const [kitchen, setKitchen] = useState([]);
  const [electrical, setElectrical] = useState([]);
  const [terrace, setTerrace] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [budgetMaterial, setBudgetMaterial] = useState("");
  const [budgetLabour, setBudgetLabour] = useState("");
  const [budgetEquipment, setBudgetEquipment] = useState("");
  const [budgetMisc, setBudgetMisc] = useState("");
  const [status, setStatus] = useState("Planning");
  const [progress, setProgress] = useState(0);
  const [phases, setPhases] = useState(defaultPhases);
  const [selectedActivityIds, setSelectedActivityIds] = useState(() => new Set());
  const [phasesExpanded, setPhasesExpanded] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const projectCode = isEditMode ? (editProject.projectCode || `CF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`) : `CF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setSupervisorsLoading(true);
    workerAPI.getSupervisors()
      .then(({ data }) => setSupervisors(data.supervisors || []))
      .catch(() => setSupervisors([]))
      .finally(() => setSupervisorsLoading(false));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    setProjectName(editProject.projectName || "");
    setCity(editProject.city || editProject.location || "");
    setMapAddress(editProject.mapAddress || "");
    setClientName(editProject.clientName || "");
    setContactNumber(editProject.contactNumber || "");
    setSiteEngineer(editProject.siteEngineer || "");
    setContractorName(editProject.contractorName || "");
    setManager(editProject.manager || "");
    setMainType(editProject.mainType || "Residential");
    setSubType(editProject.subType || "Select Sub Type");
    setCustomSubType(editProject.customSubType || "");
    setLandArea(editProject.landArea || "");
    setLandUnit(editProject.landUnit || "Sq ft");
    setSelectedFloors(editProject.floors || []);
    setRooms({
      room1BHK: editProject.room1BHK || 0,
      room2BHK: editProject.room2BHK || 0,
      room3BHK: editProject.room3BHK || 0,
      roomCustom: editProject.roomCustom || 0,
    });
    setBathrooms({
      bathWestern: editProject.bathWestern || 0,
      bathIndian: editProject.bathIndian || 0,
      bathCommon: editProject.bathCommon || 0,
      bathAttached: editProject.bathAttached || 0,
    });
    setFeatures(editProject.selectedFeatures || []);
    setUtilities(editProject.utilities || []);
    setGas(editProject.gas || []);
    setKitchen(editProject.kitchen || []);
    setElectrical(editProject.electrical || []);
    setTerrace(editProject.terrace || []);
    setBudgetMaterial(editProject.budgetMaterial || "");
    setBudgetLabour(editProject.budgetLabour || "");
    setBudgetEquipment(editProject.budgetEquipment || "");
    setBudgetMisc(editProject.budgetMisc || "");
    setStartDate(editProject.startDate ? new Date(editProject.startDate).toISOString().split("T")[0] : "");
    setExpectedEndDate(editProject.expectedEndDate ? new Date(editProject.expectedEndDate).toISOString().split("T")[0] : "");
    setStatus(editProject.status || "Planning");
    setProgress(editProject.progress || 0);
    if (editProject.selectedPhases) {
      setPhases(editProject.selectedPhases);
      const ids = new Set();
      editProject.selectedPhases.forEach(p => p.activities.forEach(a => ids.add(a.id)));
      setSelectedActivityIds(ids);
    }
    if (editProject.photo) {
      setPhotoPreview(resolveImageUrl(editProject.photo));
      setRemoveExistingPhoto(false);
    }
  }, [isEditMode]);

  const allActivityIds = useMemo(() => {
    const ids = new Set();
    phases.forEach(p => p.activities.forEach(a => ids.add(a.id)));
    return ids;
  }, [phases]);

  const toggleActivitySelection = (activityId) => {
    setSelectedActivityIds(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId); else next.add(activityId);
      return next;
    });
  };

  const togglePhaseSelection = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    const actIds = phase.activities.map(a => a.id);
    const allSelected = actIds.every(id => selectedActivityIds.has(id));
    setSelectedActivityIds(prev => {
      const next = new Set(prev);
      actIds.forEach(id => { if (allSelected) next.delete(id); else next.add(id); });
      return next;
    });
  };

  const selectAllPhases = () => {
    setSelectedActivityIds(new Set(allActivityIds));
  };

  const clearAllPhases = () => {
    setSelectedActivityIds(new Set());
  };

  const selectedCount = selectedActivityIds.size;
  const totalCount = allActivityIds.size;

  const handleAddCustomPhase = () => {
    const name = prompt("Enter custom phase name:");
    if (!name || !name.trim()) return;
    setPhases(prev => addCustomPhase(prev, name.trim()));
  };

  const handleAddCustomActivity = (phaseId) => {
    const name = prompt("Enter custom activity name:");
    if (!name || !name.trim()) return;
    setPhases(prev => addActivityToPhase(prev, phaseId, name.trim()));
  };

  const handlePhotoFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemoveExistingPhoto(false);
  };

  const removePhoto = (e) => {
    e.stopPropagation();
    setPhotoFile(null);
    setPhotoPreview(null);
    if (isEditMode && editProject.photo) setRemoveExistingPhoto(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    setErrMsg("");
    setSuccessMsg("");
    if (!projectName.trim()) { setErrMsg("Project name is required."); return; }

    const fd = new FormData();
    fd.append("projectName", projectName.trim());
    fd.append("projectCode", projectCode);
    fd.append("city", city);
    fd.append("location", city);
    fd.append("mapAddress", mapAddress);
    fd.append("clientName", clientName);
    fd.append("contactNumber", contactNumber);
    fd.append("siteEngineer", siteEngineer);
    fd.append("contractorName", contractorName);
    fd.append("manager", manager);
    fd.append("mainType", mainType);
    fd.append("subType", subType === "Other (Custom)" ? customSubType : subType);
    fd.append("landArea", landArea);
    fd.append("landUnit", landUnit);
    fd.append("floors", JSON.stringify(selectedFloors));
    fd.append("room1BHK", rooms.room1BHK);
    fd.append("room2BHK", rooms.room2BHK);
    fd.append("room3BHK", rooms.room3BHK);
    fd.append("roomCustom", rooms.roomCustom);
    fd.append("bathWestern", bathrooms.bathWestern);
    fd.append("bathIndian", bathrooms.bathIndian);
    fd.append("bathCommon", bathrooms.bathCommon);
    fd.append("bathAttached", bathrooms.bathAttached);
    fd.append("selectedFeatures", JSON.stringify(features));
    fd.append("utilities", JSON.stringify(utilities));
    fd.append("gas", JSON.stringify(gas));
    fd.append("kitchen", JSON.stringify(kitchen));
    fd.append("electrical", JSON.stringify(electrical));
    fd.append("terrace", JSON.stringify(terrace));
    fd.append("budgetMaterial", budgetMaterial || 0);
    fd.append("budgetLabour", budgetLabour || 0);
    fd.append("budgetEquipment", budgetEquipment || 0);
    fd.append("budgetMisc", budgetMisc || 0);
    fd.append("budget", Number(budgetMaterial || 0) + Number(budgetLabour || 0) + Number(budgetEquipment || 0) + Number(budgetMisc || 0));
    fd.append("startDate", startDate || "");
    fd.append("expectedEndDate", expectedEndDate || "");
    fd.append("status", status);
    fd.append("progress", progress);
    if (photoFile) fd.append("photo", photoFile);
    const filteredPhases = phases
      .map(p => ({
        ...p,
        activities: p.activities.filter(a => selectedActivityIds.has(a.id)),
      }))
      .filter(p => p.activities.length > 0);
    fd.append("selectedPhases", JSON.stringify(filteredPhases));

    try {
      setSaving(true);
      if (isEditMode) {
        const projectId = editProject?._id || editProject?.id;
        if (!projectId) { setErrMsg("Project ID missing."); setSaving(false); return; }
        await projectAPI.update(projectId, fd);
      } else {
        await projectAPI.create(fd);
      }
      setSuccessMsg(isEditMode ? "Project updated successfully!" : "Project created successfully!");
      setTimeout(() => navigate("/projects", { replace: true }), 600);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const showSubTypeCustom = subType === "Other (Custom)";

  const subTypes = buildingTypes[mainType] || buildingTypes.Residential;

  const inputStyle = {
    width: "100%", padding: "11px 14px", background: "#fff", border: "1px solid #E7E8F5",
    borderRadius: 10, fontSize: 14, color: "#1F2937", outline: "none",
    fontFamily: "'Inter', 'Segoe UI', sans-serif", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#4B5563", marginBottom: 6, display: "block" };
  const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 };
  const totalBudget = Number(budgetMaterial || 0) + Number(budgetLabour || 0) + Number(budgetEquipment || 0) + Number(budgetMisc || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#F7F6FF" }}>
      {/* Top Bar */}
      <div style={{ height: TOPBAR_H, flexShrink: 0, background: "#fff", borderBottom: "1px solid #E7E8F5", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1F2937" }}>Project Setup</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>{isEditMode ? "Edit project configuration" : "Create a new construction project"}</p>
        </div>
        <button onClick={() => navigate("/projects")} style={{ padding: "9px 18px", background: "#fff", color: "#4B5563", border: "1px solid #E7E8F5", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
          ← Back to Projects
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "24px 24px 60px", boxSizing: "border-box" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#6B7280" }}>
          <span onClick={() => navigate("/projects")} style={{ color: "#6C63FF", cursor: "pointer", fontWeight: 500 }}>Projects</span>
          <span>›</span>
          <span style={{ color: "#1F2937", fontWeight: 500 }}>{isEditMode ? `Edit — ${editProject.projectName}` : "Create New Project"}</span>
        </div>

        {errMsg && <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", color: "#991B1B", fontSize: 13, marginBottom: 16 }}>⚠️ {errMsg}</div>}
        {successMsg && <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", color: "#166534", fontSize: 13, marginBottom: 16 }}>✅ {successMsg}</div>}

        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* ── A. PROJECT SETUP ── */}
          <Accordion title="Project Setup" icon="📋" defaultOpen>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Project Name *</label>
                <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Skyline Towers" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", pointerEvents: "none" }}>🏙️</span>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bengaluru" style={{ ...inputStyle, paddingLeft: 34 }} />
                </div>
              </div>
            </div>
          </Accordion>

          {/* ── B. BASIC INFORMATION ── */}
          <Accordion title="Basic Information" icon="ℹ️" defaultOpen>
            {/* Project Code */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Project Code</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F3F4FF", borderRadius: 10, border: "1px solid #E7E8F5" }}>
                <span style={{ padding: "4px 10px", background: "#6C63FF", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 6, letterSpacing: "0.5px" }}>CODE</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2937", fontFamily: "monospace" }}>{projectCode}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Map Location / Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", pointerEvents: "none" }}>📍</span>
                <input value={mapAddress} onChange={e => setMapAddress(e.target.value)} placeholder="Full site address" style={{ ...inputStyle, paddingLeft: 34 }} />
              </div>
            </div>

            {/* Client Details */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>Client Details</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client / Owner" style={inputStyle} />
                <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="+91 XXXXX XXXXX" maxLength={10} style={inputStyle} />
              </div>
            </div>

            {/* Site Team */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>👷</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>Site Team</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <input value={siteEngineer} onChange={e => setSiteEngineer(e.target.value)} placeholder="Engineer in charge" style={inputStyle} />
                <input value={contractorName} onChange={e => setContractorName(e.target.value)} placeholder="Main contractor" style={inputStyle} />
              </div>
            </div>
          </Accordion>

          {/* ── C. BUILDING TYPE ── */}
          <Accordion title="Building Type" icon="🏢" defaultOpen>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Main Type</label>
                <div style={{ position: "relative" }}>
                  <select value={mainType} onChange={e => { setMainType(e.target.value); setSubType("Select Sub Type"); }} style={selectStyle}>
                    {Object.keys(buildingTypes).map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none", fontSize: 12 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Sub Type</label>
                <div style={{ position: "relative" }}>
                  <select value={showSubTypeCustom ? "Other (Custom)" : subType} onChange={e => setSubType(e.target.value)} style={selectStyle}>
                    {subTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none", fontSize: 12 }}>▾</span>
                </div>
              </div>
            </div>
            {showSubTypeCustom && (
              <div style={{ marginTop: 12 }}>
                <input value={customSubType} onChange={e => setCustomSubType(e.target.value)} placeholder="Enter custom sub type" style={inputStyle} />
              </div>
            )}
          </Accordion>

          {/* ── D. LAND & FLOORS ── */}
          <Accordion title="Land & Floors" icon="🌍" defaultOpen>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Total Land Area</label>
              <div style={{ display: "flex", gap: 12 }}>
                <input value={landArea} onChange={e => setLandArea(e.target.value)} placeholder="2400" type="number" style={{ ...inputStyle, flex: 2 }} />
                <div style={{ position: "relative", flex: 1 }}>
                  <select value={landUnit} onChange={e => setLandUnit(e.target.value)} style={selectStyle}>
                    {landUnits.map(u => <option key={u}>{u}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none", fontSize: 12 }}>▾</span>
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Floors Included</label>
              <ChipSelect options={floorOptions} selected={selectedFloors} onChange={setSelectedFloors} multi />
            </div>
          </Accordion>

          {/* ── E. ROOMS & BATHROOMS ── */}
          <Accordion title="Rooms & Bathrooms" icon="🛏️" count={rooms.room1BHK + rooms.room2BHK + rooms.room3BHK + rooms.roomCustom + bathrooms.bathWestern + bathrooms.bathIndian + bathrooms.bathCommon + bathrooms.bathAttached}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Room Types</div>
              <Stepper label="1 BHK" value={rooms.room1BHK} onChange={v => setRooms(p => ({ ...p, room1BHK: v }))} />
              <Stepper label="2 BHK" value={rooms.room2BHK} onChange={v => setRooms(p => ({ ...p, room2BHK: v }))} />
              <Stepper label="3 BHK" value={rooms.room3BHK} onChange={v => setRooms(p => ({ ...p, room3BHK: v }))} />
              <Stepper label="Custom Room" value={rooms.roomCustom} onChange={v => setRooms(p => ({ ...p, roomCustom: v }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Bathroom Types</div>
              <Stepper label="Western Toilet" value={bathrooms.bathWestern} onChange={v => setBathrooms(p => ({ ...p, bathWestern: v }))} />
              <Stepper label="Indian Toilet" value={bathrooms.bathIndian} onChange={v => setBathrooms(p => ({ ...p, bathIndian: v }))} />
              <Stepper label="Common Bath" value={bathrooms.bathCommon} onChange={v => setBathrooms(p => ({ ...p, bathCommon: v }))} />
              <Stepper label="Attached Bath" value={bathrooms.bathAttached} onChange={v => setBathrooms(p => ({ ...p, bathAttached: v }))} />
            </div>
          </Accordion>

          {/* ── F. ADDITIONAL CONFIGURATION ── */}
          <Accordion title="Additional Configuration" icon="⚙️" count={features.length}>
            <CheckboxGroup items={additionalFeatures} selected={features} onChange={setFeatures} />
          </Accordion>

          {/* ── G. UTILITY & SERVICES ── */}
          <Accordion title="Utility & Services" icon="💡" count={utilities.length}>
            <CheckboxGroup items={utilityServices} selected={utilities} onChange={setUtilities} />
          </Accordion>

          {/* ── H. GAS CONNECTION ── */}
          <Accordion title="Gas Connection" icon="🔥" count={gas.length}>
            <CheckboxGroup items={gasConnections} selected={gas} onChange={setGas} />
          </Accordion>

          {/* ── I. KITCHEN REQUIREMENTS ── */}
          <Accordion title="Kitchen Requirements" icon="🍳" count={kitchen.length}>
            <CheckboxGroup items={kitchenReqs} selected={kitchen} onChange={setKitchen} />
          </Accordion>

          {/* ── J. ELECTRICAL & PLUMBING ── */}
          <Accordion title="Electrical & Plumbing" icon="⚡" count={electrical.length}>
            <CheckboxGroup items={electricalPlumbing} selected={electrical} onChange={setElectrical} />
          </Accordion>

          {/* ── K. TERRACE & INTERIOR ── */}
          <Accordion title="Terrace & Interior" icon="🏠" count={terrace.length}>
            <CheckboxGroup items={terraceInterior} selected={terrace} onChange={setTerrace} />
          </Accordion>

          {/* ── L. DATES, BUDGET & STATUS ── */}
          <Accordion title="Dates, Budget & Status" icon="📅" defaultOpen>
            {/* Timeline */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Project Timeline</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", pointerEvents: "none" }}>📅</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, paddingLeft: 34, color: startDate ? "#1F2937" : "#9CA3AF" }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Expected End Date</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", pointerEvents: "none" }}>📅</span>
                    <input type="date" value={expectedEndDate} onChange={e => setExpectedEndDate(e.target.value)} style={{ ...inputStyle, paddingLeft: 34, color: expectedEndDate ? "#1F2937" : "#9CA3AF" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Breakdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Budget Breakdown (₹)</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Material", val: budgetMaterial, set: setBudgetMaterial, color: "#6C63FF" },
                  { label: "Labour", val: budgetLabour, set: setBudgetLabour, color: "#3B82F6" },
                  { label: "Equipment", val: budgetEquipment, set: setBudgetEquipment, color: "#7B3FE7" },
                  { label: "Miscellaneous", val: budgetMisc, set: setBudgetMisc, color: "#F59E0B" },
                ].map(b => (
                  <div key={b.label}>
                    <label style={labelStyle}>{b.label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E7E8F5", borderRadius: 10, padding: "11px 14px" }}>
                      <span style={{ fontSize: 14, color: b.color, fontWeight: 700 }}>₹</span>
                      <input value={b.val} onChange={e => b.set(e.target.value)} placeholder="0" type="number" style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1F2937", fontFamily: "inherit" }} />
                    </div>
                  </div>
                ))}
              </div>
              {totalBudget > 0 && (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#1F2937", textAlign: "right" }}>
                  Total: ₹{totalBudget.toLocaleString("en-IN")}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Project Status</div>
              <ChipSelect options={statusChips} selected={status} onChange={setStatus} multi={false} />
            </div>
          </Accordion>

          {/* ── M. CONSTRUCTION PHASES ── */}
          <Accordion title="Construction Phases" icon="🏗️" defaultOpen>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EEF0F5", padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#1F2937", letterSpacing: 0.5 }}>CONSTRUCTION PHASES</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6C63FF", cursor: "pointer" }} onClick={selectAllPhases}>Select All</span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>|</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", cursor: "pointer" }} onClick={clearAllPhases}>Clear</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Select phases and activities required.</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6C63FF", marginTop: 6 }}>{selectedCount} of {totalCount} activities selected</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {phases.map((phase, idx) => {
                const actIds = phase.activities.map(a => a.id);
                const allSel = actIds.every(id => selectedActivityIds.has(id));
                const someSel = actIds.some(id => selectedActivityIds.has(id));
                const isExpanded = phasesExpanded[phase.id] !== false;
                return (
                  <div key={phase.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #EEF0F5", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10 }}>
                      <div onClick={() => togglePhaseSelection(phase.id)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${allSel ? "#6C63FF" : "#CDD0DA"}`, background: allSel ? "#6C63FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}>
                        {allSel && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1F2937" }}>{phase.phaseName}</div>
                      </div>
                      <div onClick={() => setPhasesExpanded(prev => ({ ...prev, [phase.id]: !isExpanded }))} style={{ cursor: "pointer", color: "#9CA3AF", fontSize: 18, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>▾</div>
                    </div>
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #EEF0F5" }}>
                        {phase.activities.map(act => {
                          const isSel = selectedActivityIds.has(act.id);
                          return (
                            <div key={act.id} onClick={() => toggleActivitySelection(act.id)}
                              style={{ display: "flex", alignItems: "center", padding: "10px 16px 10px 20px", gap: 10, cursor: "pointer", borderTop: "1px solid #F3F4F6" }}>
                              <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${isSel ? "#6C63FF" : "#CDD0DA"}`, background: isSel ? "#6C63FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                                {isSel && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                              </div>
                              <span style={{ flex: 1, fontSize: 14, fontWeight: isSel ? 500 : 400, color: isSel ? "#1F2937" : "#6B7280" }}>{act.name}</span>
                            </div>
                          );
                        })}
                        <div onClick={() => handleAddCustomActivity(phase.id)} style={{ padding: "8px 16px 12px 20px", cursor: "pointer" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#6C63FF" }}>+ Add Custom Activity</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div onClick={handleAddCustomPhase} style={{ marginTop: 12, cursor: "pointer", padding: "4px 0" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#6C63FF" }}>+ Add Custom Phase</span>
            </div>
          </Accordion>

          {/* ── N. SITE PHOTO ── */}
          <Accordion title="Site Photo" icon="📷">
            <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/gif, image/webp" style={{ display: "none" }} onChange={e => handlePhotoFile(e.target.files[0])} />
            <div onClick={() => fileInputRef.current.click()} style={{ border: `2px dashed ${photoPreview ? "#6C63FF" : "#E7E8F5"}`, borderRadius: 12, padding: photoPreview ? 0 : "28px 20px", background: photoPreview ? "transparent" : "#FAFAFA", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.2s", overflow: "hidden", minHeight: 120, justifyContent: "center" }}>
              {photoPreview ? (
                <div style={{ position: "relative", width: "100%" }}>
                  <img src={photoPreview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", borderRadius: 10 }} />
                  <button onClick={removePhoto} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✕ Remove</button>
                </div>
              ) : (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ECEBFF", border: "1px solid #E7E8F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📷</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#4B5563" }}>Click to upload or drag and drop</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>PNG, JPG, GIF, WebP up to 10MB</div>
                  </div>
                </>
              )}
            </div>
          </Accordion>

          {/* ── O. PROJECT SCOPE ── */}
          <Accordion title="Project Scope" icon="📝">
            <textarea value={""} onChange={() => {}}
              placeholder="Describe the primary objectives and key milestones of the project..."
              rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, width: "100%" }} />
          </Accordion>

          {/* ── Buttons ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ minHeight: 48, padding: "14px 0", background: "#6C63FF", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(108,99,255,0.3)", opacity: saving ? 0.6 : 1, transition: "background 0.2s" }}>
              {saving ? "⏳ Saving…" : isEditMode ? "💾 Update Project" : "💾 Create Project"}
            </button>
            <button onClick={() => navigate("/projects")} disabled={saving}
              style={{ minHeight: 48, padding: "14px 0", background: "#fff", color: "#4B5563", border: "1px solid #E7E8F5", borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
