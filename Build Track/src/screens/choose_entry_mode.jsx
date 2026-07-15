import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ChooseEntryMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const project = location.state?.project || null;
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => {
      if (selected === "voice") navigate("/voice", { state: { project } });
      else navigate("/manualentry", { state: { project } });
    }, 400);
    return () => clearTimeout(timer);
  }, [selected, navigate, project]);

  const modes = [
    {
      key: "voice",
      icon: "🎤",
      title: "Voice Entry",
      desc: "Speak naturally to log materials, wages, or expenses. AI-powered parsing handles the details.",
      color: "#7c3aed",
      bg: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
      border: "#c4b5fd",
      features: ["AI-powered parsing", "Hands-free operation", "Instant transcription"],
    },
    {
      key: "manual",
      icon: "📝",
      title: "Manual Entry",
      desc: "Fill in the details manually with full control over every field and attachment.",
      color: "#0891b2",
      bg: "linear-gradient(135deg, #ecfeff, #cffafe)",
      border: "#67e8f9",
      features: ["Full field control", "Photo attachments", "Bulk CSV import"],
    },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8",
    }}>
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ padding: "8px 14px", background: "#f3f4f6", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer" }}>
          ← Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Add Entry</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>Choose how you'd like to add this entry</p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            {[1, 2, 3].map((step) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: step <= 1 ? "#ea580c" : "#e5e5e5",
                  color: step <= 1 ? "#fff" : "#999",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>
                  {step < 1 ? "✓" : step}
                </div>
                {step < 3 && <div style={{ width: 40, height: 2, background: step < 1 ? "#ea580c" : "#e5e5e5" }} />}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", width: 200, margin: "0 auto" }}>
            <span style={{ fontSize: 11, color: "#ea580c", fontWeight: 600 }}>Entry Type</span>
            <span style={{ fontSize: 11, color: "#888" }}>Context</span>
            <span style={{ fontSize: 11, color: "#888" }}>Entry</span>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 8, textAlign: "center" }}>
          How would you like to add this entry?
        </h2>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 32, textAlign: "center", maxWidth: 400 }}>
          Choose the method that works best for you right now
        </p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, maxWidth: 700, width: "100%" }}>
          {modes.map(mode => {
            const isActive = hovered === mode.key || selected === mode.key;
            return (
              <div
                key={mode.key}
                onClick={() => setSelected(mode.key)}
                onMouseEnter={() => setHovered(mode.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: "32px 28px", borderRadius: 20, cursor: "pointer",
                  border: `2px solid ${isActive ? mode.color : "#e5e5e5"}`,
                  background: isActive ? mode.bg : "#fff",
                  boxShadow: isActive ? `0 8px 30px ${mode.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.25s ease",
                  transform: isActive ? "translateY(-4px)" : "none",
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: `${mode.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, marginBottom: 20,
                }}>
                  {mode.icon}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>{mode.title}</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 20 }}>{mode.desc}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mode.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#555" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: mode.color, flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                {selected === mode.key && (
                  <div style={{
                    marginTop: 20, padding: "10px 0", background: mode.color, color: "#fff",
                    borderRadius: 10, textAlign: "center", fontSize: 14, fontWeight: 600,
                  }}>
                    Selecting…
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {project && (
          <div style={{ marginTop: 24, padding: "10px 20px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, fontSize: 13, color: "#0369a1" }}>
            📍 Adding entry for: <strong>{project.projectName || project.name}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
