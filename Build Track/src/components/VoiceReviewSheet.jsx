import { useState, useCallback } from "react";

const STEPS = [
  { id: "entryType", label: "Entry Type", icon: "📦", required: true },
  { id: "project", label: "Project", icon: "🏗️", required: true },
  { id: "floor", label: "Floor", icon: "🏢", required: false },
  { id: "phase", label: "Phase", icon: "📋", required: false },
  { id: "activity", label: "Activity", icon: "🔨", required: false },
  { id: "itemName", label: "Item Name", icon: "🏷️", required: true },
  { id: "quantity", label: "Quantity", icon: "#️⃣", required: true },
  { id: "unit", label: "Unit", icon: "📐", required: true },
  { id: "rate", label: "Rate (₹)", icon: "💰", required: true },
  { id: "optionals", label: "Details", icon: "📝", required: false },
  { id: "review", label: "Review", icon: "✅", required: true },
];

const ENTRY_TYPES = [
  { key: "material", label: "Material", icon: "🧱", desc: "Cement, sand, steel, bricks..." },
  { key: "labour", label: "Labour", icon: "👷", desc: "Workers, masons, helpers..." },
  { key: "equipment", label: "Equipment", icon: "🚜", desc: "JCB, crane, mixer..." },
];

const UNITS = ["Bags", "Kg", "Tons", "CFT", "Sqft", "Rft", "Nos", "Ltrs", "Cum", "Days", "Hours", "Per Day", "Trips"];

const QUICK_ITEMS = {
  material: ["Cement", "Sand", "Steel", "Bricks", "Aggregate", "Tiles", "Paint", "Pipes"],
  labour: ["Mason", "Helper", "Carpenter", "Plumber", "Electrician", "Painter"],
  equipment: ["JCB", "Crane", "Mixer", "Compactor", "Loader", "Excavator"],
};

const formatINR = (n) => {
  const num = Number(n);
  if (isNaN(num)) return "0";
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  return num.toLocaleString("en-IN");
};

function buildInitialData(d = {}) {
  return {
    entryType: d.entryType || "",
    project: d.project || "",
    projectName: d.projectName || "",
    floor: d.floor || "",
    phase: d.phase || "",
    activity: d.activity || "",
    itemName: d.itemName || "",
    quantity: d.quantity || "",
    unit: d.unit || "",
    rate: d.rate || "",
    brand: d.brand || "",
    supplier: d.supplier || "",
    gst: d.gst || "",
    paymentMode: d.paymentMode || "cash",
    notes: d.notes || "",
  };
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#5a6b82",
  letterSpacing: "0.08em", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid #e5e7eb", background: "#fff",
  fontSize: 14, outline: "none", marginBottom: 12,
  boxSizing: "border-box",
};

export default function VoiceReviewSheet({
  isOpen,
  onClose,
  initialData = {},
  projects = [],
  onSave,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(() => buildInitialData(initialData));
  const [customInput, setCustomInput] = useState("");

  const computedAmount = Number(data.quantity || 0) * Number(data.rate || 0);
  const amountWithGST = data.gst
    ? computedAmount + computedAmount * (Number(data.gst) / 100)
    : computedAmount;

  const updateField = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const goNext = useCallback(() => {
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 150);
  }, []);

  const answeredSteps = STEPS.slice(0, currentStep).filter(s => {
    if (s.id === "entryType") return !!data.entryType;
    if (s.id === "project") return !!data.project;
    if (s.id === "floor") return !!data.floor;
    if (s.id === "phase") return !!data.phase;
    if (s.id === "activity") return !!data.activity;
    if (s.id === "itemName") return !!data.itemName;
    if (s.id === "quantity") return !!data.quantity;
    if (s.id === "unit") return !!data.unit;
    if (s.id === "rate") return !!data.rate;
    return false;
  });

  const handleSave = () => {
    onSave?.({
      ...data,
      amount: amountWithGST,
      computedAmount,
    });
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        width: "100%", maxWidth: 560, maxHeight: "92vh",
        background: "#f4f6fc", borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#d1d5db" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#fff", boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}>
              🎤
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f1724" }}>BuildTrack AI</div>
              <div style={{ fontSize: 11, color: "#5a6b82" }}>Step-by-step entry</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "#f3f4f6", fontSize: 16, cursor: "pointer", color: "#666",
          }}>✕</button>
        </div>

        {/* Progress */}
        {step.id !== "entryType" && step.id !== "review" && (
          <div style={{ padding: "0 20px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#5a6b82" }}>
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1" }}>
                {step.label}
              </span>
            </div>
            <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
              <div style={{
                height: "100%", width: `${progress}%`, borderRadius: 2,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* Answered chips */}
        {answeredSteps.length > 0 && step.id !== "entryType" && (
          <div style={{
            display: "flex", gap: 6, padding: "0 20px 10px",
            overflowX: "auto", flexShrink: 0,
          }}>
            {answeredSteps.map(s => {
              let val = "";
              switch (s.id) {
                case "project": val = data.projectName || data.project; break;
                case "floor": val = data.floor; break;
                case "phase": val = data.phase; break;
                case "activity": val = data.activity; break;
                case "itemName": val = data.itemName; break;
                case "quantity": val = `${data.quantity} ${data.unit}`; break;
                case "rate": val = `₹${formatINR(data.rate)}`; break;
                default: val = ""; break;
              }
              if (!val) return null;
              return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1px solid #c7d2fe", background: "#eef2ff",
                  fontSize: 11, fontWeight: 600, color: "#4338ca",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  <span>{s.icon}</span>
                  <span>{val}</span>
                  <span style={{ color: "#10b981", marginLeft: 2 }}>✓</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Step content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {renderStepContent({
            step, data, updateField, goNext, customInput, setCustomInput, projects,
            computedAmount, amountWithGST, setCurrentStep, handleSave,
          })}
        </div>
      </div>
    </div>
  );
}

function renderStepContent({ step, data, updateField, goNext, customInput, setCustomInput, projects, computedAmount, amountWithGST, setCurrentStep, handleSave }) {
  switch (step.id) {
    case "entryType":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            What type of entry?
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 20 }}>
            Select the category that best describes this entry
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {ENTRY_TYPES.map(t => (
              <div key={t.key} onClick={() => { updateField("entryType", t.key); setTimeout(goNext, 200); }}
                style={{
                  padding: "20px 12px", borderRadius: 14, cursor: "pointer",
                  border: `2px solid ${data.entryType === t.key ? "#6366f1" : "#e5e7eb"}`,
                  background: data.entryType === t.key ? "#eef2ff" : "#fff",
                  textAlign: "center", transition: "all 0.2s ease",
                }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1724", marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#5a6b82" }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "project":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Select Project
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            Which project is this entry for?
          </div>
          {projects.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {projects.map(p => (
                <div key={p._id} onClick={() => { updateField("project", p._id); updateField("projectName", p.projectName || p.name); setTimeout(goNext, 200); }}
                  style={{
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${data.project === p._id ? "#6366f1" : "#e5e7eb"}`,
                    background: data.project === p._id ? "#eef2ff" : "#fff",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: data.project === p._id ? "#6366f1" : "#f3f4f6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>🏗️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0f1724" }}>{p.projectName || p.name}</div>
                    {p.location && <div style={{ fontSize: 12, color: "#5a6b82" }}>{p.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 600, color: "#5a6b82", letterSpacing: "0.05em", marginBottom: 8 }}>
            OR TYPE PROJECT NAME
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && customInput.trim()) { updateField("project", customInput.trim()); updateField("projectName", customInput.trim()); goNext(); } }}
              placeholder="Type project name..."
              style={{
                flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb",
                background: "#fff", fontSize: 14, outline: "none",
              }} />
            <button onClick={() => { if (customInput.trim()) { updateField("project", customInput.trim()); updateField("projectName", customInput.trim()); goNext(); } }}
              style={{
                padding: "12px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>→</button>
          </div>
        </div>
      );

    case "floor":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Floor / Level
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            Optional — which floor or level?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "Roof"].map(f => (
              <div key={f} onClick={() => { updateField("floor", f); setTimeout(goNext, 200); }}
                style={{
                  padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                  border: `2px solid ${data.floor === f ? "#6366f1" : "#e5e7eb"}`,
                  background: data.floor === f ? "#eef2ff" : "#fff",
                  fontSize: 13, fontWeight: 600, color: data.floor === f ? "#4338ca" : "#5a6b82",
                }}>{f}</div>
            ))}
          </div>
          <input value={customInput} onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { updateField("floor", customInput || "N/A"); goNext(); } }}
            placeholder="Or type floor..."
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, outline: "none",
            }} />
          <button onClick={() => { updateField("floor", "N/A"); goNext(); }}
            style={{
              marginTop: 12, width: "100%", padding: "12px", borderRadius: 10,
              border: "1px solid #6366f1", background: "transparent",
              color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Skip — No floor</button>
        </div>
      );

    case "phase":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Construction Phase
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            Which phase of construction?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {["Foundation", "Structure", "Plastering", "Electrical", "Plumbing", "Finishing"].map(p => (
              <div key={p} onClick={() => { updateField("phase", p); setTimeout(goNext, 200); }}
                style={{
                  padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${data.phase === p ? "#6366f1" : "#e5e7eb"}`,
                  background: data.phase === p ? "#eef2ff" : "#fff",
                  fontSize: 14, fontWeight: 600, color: data.phase === p ? "#4338ca" : "#0f1724",
                }}>{p}</div>
            ))}
          </div>
          <input value={customInput} onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { updateField("phase", customInput || "N/A"); goNext(); } }}
            placeholder="Or type phase..."
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, outline: "none",
            }} />
          <button onClick={() => { updateField("phase", "N/A"); goNext(); }}
            style={{
              marginTop: 12, width: "100%", padding: "12px", borderRadius: 10,
              border: "1px solid #6366f1", background: "transparent",
              color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Skip — No phase</button>
        </div>
      );

    case "activity":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Activity
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            What work is being done?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {["Excavation", "Pouring", "Brickwork", "Plastering", "Painting", "Wiring", "Pipe fitting", "Tiling"].map(a => (
              <div key={a} onClick={() => { updateField("activity", a); setTimeout(goNext, 200); }}
                style={{
                  padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                  border: `2px solid ${data.activity === a ? "#6366f1" : "#e5e7eb"}`,
                  background: data.activity === a ? "#eef2ff" : "#fff",
                  fontSize: 13, fontWeight: 600, color: data.activity === a ? "#4338ca" : "#5a6b82",
                }}>{a}</div>
            ))}
          </div>
          <input value={customInput} onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { updateField("activity", customInput || "N/A"); goNext(); } }}
            placeholder="Or type activity..."
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, outline: "none",
            }} />
          <button onClick={() => { updateField("activity", "N/A"); goNext(); }}
            style={{
              marginTop: 12, width: "100%", padding: "12px", borderRadius: 10,
              border: "1px solid #6366f1", background: "transparent",
              color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Skip — No activity</button>
        </div>
      );

    case "itemName":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Item Name
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            What is this entry about?
          </div>
          {data.entryType && QUICK_ITEMS[data.entryType] && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {QUICK_ITEMS[data.entryType].map(item => (
                <div key={item} onClick={() => { updateField("itemName", item); setTimeout(goNext, 200); }}
                  style={{
                    padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                    border: `2px solid ${data.itemName === item ? "#6366f1" : "#e5e7eb"}`,
                    background: data.itemName === item ? "#eef2ff" : "#fff",
                    fontSize: 13, fontWeight: 600, color: data.itemName === item ? "#4338ca" : "#5a6b82",
                  }}>{item}</div>
              ))}
            </div>
          )}
          <input value={customInput} onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && customInput.trim()) { updateField("itemName", customInput.trim()); goNext(); } }}
            placeholder="Type item name..."
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, outline: "none",
            }} />
        </div>
      );

    case "quantity":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Quantity
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            How many / how much?
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <input type="number" value={data.quantity} onChange={e => updateField("quantity", e.target.value)}
              placeholder="0" autoFocus
              style={{
                flex: 1, padding: "14px", borderRadius: 10,
                border: "2px solid #6366f1", background: "#fff",
                fontSize: 24, fontWeight: 700, color: "#0f1724", outline: "none",
                textAlign: "center",
              }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[5, 10, 20, 50, 100].map(n => (
              <div key={n} onClick={() => updateField("quantity", String(n))}
                style={{
                  padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                  border: "1px solid #e5e7eb", background: "#fff",
                  fontSize: 13, fontWeight: 600, color: "#5a6b82",
                }}>{n}</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.quantity}
            style={{
              marginTop: 16, width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: data.quantity ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e5e7eb",
              color: data.quantity ? "#fff" : "#999", fontWeight: 700, fontSize: 15,
              cursor: data.quantity ? "pointer" : "not-allowed",
            }}>Next →</button>
        </div>
      );

    case "unit":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Unit
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            What unit of measurement?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {UNITS.map(u => (
              <div key={u} onClick={() => { updateField("unit", u); setTimeout(goNext, 200); }}
                style={{
                  padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                  border: `2px solid ${data.unit === u ? "#6366f1" : "#e5e7eb"}`,
                  background: data.unit === u ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#fff",
                  color: data.unit === u ? "#fff" : "#5a6b82",
                  fontSize: 13, fontWeight: 600,
                }}>{u}</div>
            ))}
          </div>
          <input value={customInput} onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && customInput.trim()) { updateField("unit", customInput.trim()); goNext(); } }}
            placeholder="Custom unit..."
            style={{
              marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, outline: "none",
            }} />
        </div>
      );

    case "rate":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Rate (₹)
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 16 }}>
            Cost per {data.unit || "unit"}?
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#0f1724" }}>₹</span>
            <input type="number" value={data.rate} onChange={e => updateField("rate", e.target.value)}
              placeholder="0" autoFocus
              style={{
                flex: 1, padding: "14px", borderRadius: 10,
                border: "2px solid #6366f1", background: "#fff",
                fontSize: 24, fontWeight: 700, color: "#0f1724", outline: "none",
              }} />
          </div>
          {data.quantity && data.rate && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, background: "#eef2ff",
              border: "1px solid #c7d2fe", marginBottom: 16,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: "#5a6b82" }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#4338ca" }}>₹{formatINR(data.quantity * data.rate)}</span>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[100, 500, 1000, 5000, 10000].map(n => (
              <div key={n} onClick={() => updateField("rate", String(n))}
                style={{
                  padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                  border: "1px solid #e5e7eb", background: "#fff",
                  fontSize: 13, fontWeight: 600, color: "#5a6b82",
                }}>₹{n.toLocaleString("en-IN")}</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.rate}
            style={{
              marginTop: 16, width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: data.rate ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e5e7eb",
              color: data.rate ? "#fff" : "#999", fontWeight: 700, fontSize: 15,
              cursor: data.rate ? "pointer" : "not-allowed",
            }}>Next →</button>
        </div>
      );

    case "optionals":
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f1724", marginBottom: 6 }}>
            {step.icon} Additional Details
          </div>
          <div style={{ fontSize: 13, color: "#5a6b82", marginBottom: 20 }}>
            Optional — add more context
          </div>
          {data.entryType === "material" && (
            <>
              <label style={labelStyle}>BRAND</label>
              <input value={data.brand} onChange={e => updateField("brand", e.target.value)}
                placeholder="e.g. UltraTech" style={inputStyle} />
              <label style={{ ...labelStyle, marginTop: 12 }}>SUPPLIER</label>
              <input value={data.supplier} onChange={e => updateField("supplier", e.target.value)}
                placeholder="e.g. local dealer" style={inputStyle} />
              <label style={{ ...labelStyle, marginTop: 12 }}>GST %</label>
              <input type="number" value={data.gst} onChange={e => updateField("gst", e.target.value)}
                placeholder="e.g. 18" style={inputStyle} />
            </>
          )}
          <label style={{ ...labelStyle, marginTop: data.entryType === "material" ? 12 : 0 }}>PAYMENT MODE</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["cash", "upi", "bank_transfer", "credit"].map(m => (
              <div key={m} onClick={() => updateField("paymentMode", m)}
                style={{
                  padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                  border: `2px solid ${data.paymentMode === m ? "#6366f1" : "#e5e7eb"}`,
                  background: data.paymentMode === m ? "#eef2ff" : "#fff",
                  fontSize: 12, fontWeight: 600, color: data.paymentMode === m ? "#4338ca" : "#5a6b82",
                  textTransform: "capitalize",
                }}>{m.replace("_", " ")}</div>
            ))}
          </div>
          <label style={labelStyle}>NOTES</label>
          <input value={data.notes} onChange={e => updateField("notes", e.target.value)}
            placeholder="Any additional notes..." style={inputStyle} />
          <button onClick={goNext}
            style={{
              marginTop: 16, width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
            }}>Review Entry →</button>
        </div>
      );

    case "review":
      return (
        <div>
          <div style={{
            padding: "16px 20px", borderRadius: 14, marginBottom: 20,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>TOTAL AMOUNT</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>₹{formatINR(amountWithGST)}</div>
            {data.gst > 0 && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                +{data.gst}% GST = ₹{formatINR(amountWithGST)}
              </div>
            )}
          </div>
          <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}>
            {[
              { label: "Type", value: data.entryType?.charAt(0).toUpperCase() + data.entryType?.slice(1) },
              { label: "Project", value: data.projectName || data.project },
              { label: "Floor", value: data.floor || "—" },
              { label: "Phase", value: data.phase || "—" },
              { label: "Activity", value: data.activity || "—" },
              { label: "Item", value: data.itemName },
              { label: "Quantity", value: `${data.quantity} ${data.unit}` },
              { label: "Rate", value: `₹${formatINR(data.rate)} / ${data.unit}` },
              { label: "Amount", value: `₹${formatINR(computedAmount)}` },
              ...(data.brand ? [{ label: "Brand", value: data.brand }] : []),
              ...(data.supplier ? [{ label: "Supplier", value: data.supplier }] : []),
              ...(data.gst ? [{ label: "GST", value: `${data.gst}%` }] : []),
              { label: "Payment", value: data.paymentMode?.replace("_", " ") },
              ...(data.notes ? [{ label: "Notes", value: data.notes }] : []),
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px",
                borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 13, color: "#5a6b82" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f1724", textTransform: "capitalize" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={() => setCurrentStep(0)}
              style={{
                flex: 1, padding: "14px", borderRadius: 12,
                border: "2px solid #6366f1", background: "transparent",
                color: "#6366f1", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>Edit</button>
            <button onClick={handleSave}
              style={{
                flex: 2, padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
              }}>✓ Confirm &amp; Save</button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
