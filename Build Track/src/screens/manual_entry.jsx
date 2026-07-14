import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { projectAPI, transactionAPI } from "../api";
import { Toast } from "../components/Toast";
import { colors, radius, shadows, gradients, typography } from "../styles/designTokens";

const ENTRY_TYPES = [
  { key: "material", label: "Material", color: colors.primaryBlue },
  { key: "labour", label: "Labour", color: colors.primaryPurple },
  { key: "equipment", label: "Equipment", color: colors.primaryLightBlue },
];

const UNIT_OPTIONS = {
  material: ["Bags", "Kg", "Tonnes", "Sq.Ft", "Cubic Ft", "Pieces", "Liters", "Unit"],
  labour: ["Day", "Hour", "Sq.Ft", "Unit"],
  equipment: ["Day", "Hour", "Week", "Month", "Trip"],
};

const FIELDS = {
  material: [
    { key: "itemName", label: "Material / Item", required: true, type: "text" },
    { key: "quantity", label: "Quantity", required: true, type: "number" },
    { key: "rate", label: "Rate (\u20B9)", required: true, type: "number", prefix: "\u20B9" },
    { key: "brand", label: "Brand (Optional)", required: false, type: "text" },
    { key: "supplier", label: "Supplier (Optional)", required: false, type: "text" },
  ],
  labour: [
    { key: "workerName", label: "Worker / Team Name", required: true, type: "text" },
    { key: "quantity", label: "Quantity", required: true, type: "number" },
    { key: "rate", label: "Rate (\u20B9)", required: true, type: "number", prefix: "\u20B9" },
    { key: "workType", label: "Trade / Work Type (Optional)", required: false, type: "text" },
    { key: "contractor", label: "Contractor / Team (Optional)", required: false, type: "text" },
  ],
  equipment: [
    { key: "equipmentName", label: "Equipment Name", required: true, type: "text" },
    { key: "quantity", label: "Quantity (Hours/Days)", required: true, type: "number" },
    { key: "rate", label: "Rate (\u20B9)", required: true, type: "number", prefix: "\u20B9" },
    { key: "model", label: "Model / Sub-Class (Optional)", required: false, type: "text" },
    { key: "operator", label: "Operator / Vendor (Optional)", required: false, type: "text" },
  ],
};

export default function ManualEntryPage() {
  const navigate = useNavigate();
  const [entryType, setEntryType] = useState("material");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [values, setValues] = useState({});
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  useEffect(() => {
    projectAPI.getAll()
      .then(({ data }) => setProjects(data.projects || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setValues({});
    setUnit(UNIT_OPTIONS[entryType]?.[0] || "");
  }, [entryType]);

  const qty = parseFloat(values.quantity) || 0;
  const rate = parseFloat(values.rate) || 0;
  const computedAmount = qty * rate;

  const handleValue = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setErrMsg("");
    setSuccessMsg("");

    const fields = FIELDS[entryType];
    const required = fields.filter(f => f.required);
    const missing = required.filter(f => !values[f.key] || String(values[f.key]).trim() === "");
    if (missing.length > 0) {
      setErrMsg(`${missing[0].label} is required.`);
      return;
    }
    if (!selectedProject) {
      setErrMsg("Please select a project.");
      return;
    }
    if (computedAmount <= 0) {
      setErrMsg("Amount must be greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const typeMap = { material: "Materials", labour: "Wages", equipment: "Expense" };
      const nameKey = entryType === "material" ? "itemName" : entryType === "labour" ? "workerName" : "equipmentName";
      const payload = {
        title: values[nameKey] || `${entryType} entry`,
        amount: computedAmount,
        type: typeMap[entryType],
        project: selectedProject,
        date: new Date(date).toISOString(),
        notes: notes || "",
        quantity: qty,
        rate,
        unit,
      };
      await transactionAPI.create(payload);
      setSuccessMsg(`${entryType.charAt(0).toUpperCase() + entryType.slice(1)} entry saved successfully!`);
      setValues({});
      setSelectedProject("");
      setNotes("");
      setUnit(UNIT_OPTIONS[entryType]?.[0] || "");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const currentFields = FIELDS[entryType];
  const units = UNIT_OPTIONS[entryType] || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", background: colors.bgBase4, fontFamily: typography.fontFamily }}>
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />

      {/* Top Bar */}
      <div style={{ background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate("/dashboard")}
          style={{ background: colors.bgBase4, border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: colors.textPrimary }}>
          &larr;
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>New Entry</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textLight }}>Record a material, labour, or equipment entry</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        {/* Entry Type Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {ENTRY_TYPES.map(t => (
            <button key={t.key} onClick={() => setEntryType(t.key)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: radius.sm, border: "none",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                background: entryType === t.key ? gradients.primaryButton : colors.cardBg,
                color: entryType === t.key ? "#FFF" : colors.textSecondary,
                boxShadow: entryType === t.key ? "none" : shadows.card,
                transition: "all 0.15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Entry Card */}
        <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card, padding: "24px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
              {entryType === "material" ? "Material Purchase Entry" : entryType === "labour" ? "Labour Entry" : "Equipment Entry"}
            </span>
          </div>

          {/* Project */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textLight, marginBottom: 6, letterSpacing: "0.05em" }}>PROJECT <span style={{ color: colors.error }}>*</span></div>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: radius.sm,
                border: `1px solid ${colors.cardBorder}`, fontSize: 14, color: colors.textPrimary,
                background: colors.cardBg, outline: "none", cursor: "pointer",
              }}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
            </select>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textLight, marginBottom: 6, letterSpacing: "0.05em" }}>DATE <span style={{ color: colors.error }}>*</span></div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: radius.sm,
                border: `1px solid ${colors.cardBorder}`, fontSize: 14, color: colors.textPrimary,
                background: colors.cardBg, outline: "none",
              }} />
          </div>

          {/* Fields */}
          {currentFields.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textLight, marginBottom: 6, letterSpacing: "0.05em" }}>
                {f.label.toUpperCase()} {f.required && <span style={{ color: colors.error }}>*</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.bgBase4, borderRadius: radius.sm, border: `1px solid ${colors.cardBorder}`, padding: "0 14px" }}>
                {f.prefix && <span style={{ fontSize: 14, fontWeight: 600, color: colors.textLight }}>{f.prefix}</span>}
                <input type={f.type} value={values[f.key] || ""} onChange={e => handleValue(f.key, e.target.value)}
                  placeholder={f.label}
                  style={{
                    flex: 1, padding: "12px 0", border: "none", background: "transparent",
                    outline: "none", fontSize: 14, color: colors.textPrimary,
                  }} />
              </div>
            </div>
          ))}

          {/* Unit */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textLight, marginBottom: 6, letterSpacing: "0.05em" }}>UNIT <span style={{ color: colors.error }}>*</span></div>
            <select value={unit} onChange={e => setUnit(e.target.value)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: radius.sm,
                border: `1px solid ${colors.cardBorder}`, fontSize: 14, color: colors.textPrimary,
                background: colors.bgBase4, outline: "none", cursor: "pointer",
              }}>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Auto-calculated Amount */}
          <div style={{ background: "#F0F2FF", borderRadius: radius.sm, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: colors.primaryBlue, letterSpacing: "0.08em", marginBottom: 4 }}>AMOUNT (\u20B9)</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: colors.primaryBlue }}>
              \u20B9{computedAmount.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textLight, marginBottom: 6, letterSpacing: "0.05em" }}>NOTES (OPTIONAL)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..."
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: radius.sm,
                border: `1px solid ${colors.cardBorder}`, fontSize: 14, color: colors.textPrimary,
                background: colors.bgBase4, outline: "none", resize: "vertical",
                fontFamily: typography.fontFamily,
              }} />
          </div>
        </div>

        {/* Submit */}
        {errMsg && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: radius.sm, padding: "10px 14px", color: "#DC2626", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {errMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: radius.sm, padding: "10px 14px", color: "#15803D", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            {successMsg}
          </div>
        )}
        <button onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "16px 0", borderRadius: radius.md, border: "none",
            background: gradients.primaryButton, color: "#FFF", fontWeight: 700, fontSize: 16,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {saving ? (
            <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", animation: "spin 0.7s linear infinite" }} /> Saving...</>
          ) : `Save ${entryType.charAt(0).toUpperCase() + entryType.slice(1)} Entry`}
        </button>
      </div>
    </div>
  );
}
