import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard",       icon: "⊞" },
  { label: "Voice Assistant", icon: "🎤" },
  { label: "Projects",        icon: "📋" },
  { label: "Financials",      icon: "📷" },
  { label: "Settings",        icon: "⚙️" },
];

const recentEntries = [
  { worker: "Suresh - Masonry",   time: "10 mins ago", category: "WAGES",   catBg: "#dbeafe", catColor: "#1e40af", amount: "₹1,200",    income: false },
  { worker: "Cement Procurement", time: "45 mins ago", category: "EXPENSE", catBg: "#fce7f3", catColor: "#9d174d", amount: "₹45,000",   income: false },
  { worker: "Client Milestone 1", time: "2 hours ago", category: "INCOME",  catBg: "#dcfce7", catColor: "#166534", amount: "₹2,50,000", income: true  },
];

const categories = ["Wages", "Expense", "Income", "Materials"];

/* ── BuildTrack Logo Icon ── */
function LogoIcon({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(145deg, #f97316, #ea580c)",
      borderRadius: size * 0.25,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 8px rgba(234,88,12,0.35)",
      flexShrink: 0,
    }}>
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6"  y="10" width="24" height="22" rx="2" fill="white" />
        <polygon points="18,2 32,11 4,11" fill="white" />
        <rect x="9"  y="15" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="22" y="15" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="9"  y="23" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="22" y="23" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="14" y="24" width="8" height="8" rx="1" fill="#ea580c" />
      </svg>
    </div>
  );
}

export default function VoiceAssistantPage() {
  const [activeNav,   setActiveNav]   = useState("Voice Assistant");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [listening,   setListening]   = useState(true);
  const [worker,      setWorker]      = useState("Suresh - Masonry");
  const [category,    setCategory]    = useState("Wages");
  const [amount,      setAmount]      = useState("1,200");
  const [pulse,       setPulse]       = useState(true);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#faf9f7", overflow: "hidden" }}>

      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: 275, background: "#fff",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid #ebebeb", flexShrink: 0, zIndex: 50,
        position: isMobile ? "fixed" : "relative",
        top: 0, left: 0, bottom: 0, height: "100%",
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.3s ease", overflowY: "auto",
      }}>

        {/* ── Logo (replaced) ── */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoIcon size={38} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", lineHeight: 1.1 }}>BuildTrack</div>
              <div style={{ fontSize: 10, color: "#999", letterSpacing: "0.08em", fontWeight: 600 }}>MANAGEMENT</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: "12px", flex: 1 }}>
          {navItems.map((item) => (
            <button key={item.label}
              onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                background: activeNav === item.label ? "#fff5f0" : "transparent",
                color:      activeNav === item.label ? "#ea580c" : "#555",
                fontWeight: activeNav === item.label ? 600 : 400,
                fontSize: 15, marginBottom: 2, transition: "all 0.15s", textAlign: "left",
              }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fdba74", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Rajesh Kumar</div>
            <div style={{ fontSize: 11, color: "#888" }}>Site Supervisor</div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
          )}
          <div style={{ flex: 1, maxWidth: 460, display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 12, padding: "10px 16px", gap: 10 }}>
            <span style={{ color: "#aaa", fontSize: 16 }}>🔍</span>
            <input placeholder="Search entries, projects..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#555", width: "100%" }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              📝 Manual Entry
            </button>
            <div style={{ width: 38, height: 38, background: "#fff5f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, border: "1px solid #fde4d0" }}>🔔</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>

          {/* Mic Button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: -12,
                borderRadius: "50%",
                background: "rgba(234,88,12,0.12)",
                transform: pulse ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.8s ease",
              }} />
              <button
                onClick={() => setListening(l => !l)}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "#ea580c", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 32, position: "relative", zIndex: 1,
                  boxShadow: "0 8px 24px rgba(234,88,12,0.35)",
                }}>
                🎤
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a1a" }}>
                {listening ? "Listening and Processing..." : "Tap to Start Listening"}
              </h1>
              {listening && (
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#777", fontStyle: "italic" }}>
                  "Pay Suresh 1200 for Masonry today"
                </p>
              )}
            </div>
          </div>

          {/* Review Card */}
          <div style={{ width: "100%", maxWidth: 620, background: "#fff", borderRadius: 18, padding: 28, border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Review & Approve Entry</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", background: "#fff5f0", padding: "4px 12px", borderRadius: 6, letterSpacing: "0.06em", border: "1px solid #fde4d0" }}>LIVE INTERPRETATION</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", marginBottom: 8 }}>WORKER / PROJECT</div>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "10px 14px", gap: 8 }}>
                  <input value={worker} onChange={e => setWorker(e.target.value)}
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500 }} />
                  <span style={{ color: "#aaa", fontSize: 14, cursor: "pointer" }}>✏️</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", marginBottom: 8 }}>CATEGORY</div>
                <div style={{ position: "relative" }}>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 14, color: "#1a1a1a", fontWeight: 500, outline: "none", appearance: "none", cursor: "pointer" }}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>▾</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", marginBottom: 8 }}>AMOUNT (₹)</div>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "10px 14px", gap: 6 }}>
                  <span style={{ fontSize: 14, color: "#555", fontWeight: 600 }}>₹</span>
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500 }} />
                </div>
              </div>
            </div>

            <button style={{ width: "100%", padding: "16px 0", background: "#ea580c", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 14px rgba(234,88,12,0.3)", marginBottom: 12 }}>
              ✅ Confirm & Finalize Entry
            </button>
            <div style={{ textAlign: "center" }}>
              <button style={{ background: "none", border: "none", fontSize: 14, color: "#888", cursor: "pointer", fontWeight: 500 }}>
                Discard & Try Again
              </button>
            </div>
          </div>

          {/* Recent Voice Entries */}
          <div style={{ width: "100%", maxWidth: 880 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Recent Voice Entries</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                  {[12, 18, 14, 22, 16, 20, 14].map((h, i) => (
                    <div key={i} style={{ width: 4, height: pulse ? h : h * 0.6, background: "#ea580c", borderRadius: 3, transition: "height 0.4s ease", transitionDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>View History</span>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              {!isMobile && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr", padding: "12px 20px", borderBottom: "1px solid #f0f0f0" }}>
                  {["WORKER/PROJECT", "CATEGORY", "AMOUNT (₹)", "STATUS"].map(col => (
                    <div key={col} style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</div>
                  ))}
                </div>
              )}
              {recentEntries.map((e, i) => (
                !isMobile ? (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr", padding: "16px 20px", borderBottom: i < recentEntries.length - 1 ? "1px solid #f9f9f9" : "none", alignItems: "center" }}
                    onMouseEnter={ev => ev.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{e.worker}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{e.time}</div>
                    </div>
                    <div>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: e.catBg, color: e.catColor, letterSpacing: "0.04em" }}>{e.category}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: e.income ? "#16a34a" : "#1a1a1a" }}>{e.amount}</div>
                    <div style={{ fontSize: 20 }}>✅</div>
                  </div>
                ) : (
                  <div key={i} style={{ padding: "14px 16px", borderBottom: i < recentEntries.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{e.worker}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{e.time}</div>
                      </div>
                      <span style={{ fontSize: 18 }}>✅</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: e.catBg, color: e.catColor }}>{e.category}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: e.income ? "#16a34a" : "#1a1a1a" }}>{e.amount}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

        </div>{/* /body */}
      </div>{/* /main */}
    </div>
  );
}