import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI, workerAPI, projectAPI } from "../api";

function extractAmount(text) {
  text = text.toLowerCase();
  const num = text.match(/\d+/);
  if (num) return Number(num[0]);
  if (text.includes("thousand")) return 1000;
  if (text.includes("lakh"))     return 100000;
  if (text.includes("crore"))    return 10000000;
  return 0;
}

function detectCategory(text) {
  let category = "Expense";
  if (/pay|paid|wage|salary/i.test(text))             category = "Wages";
  if (/cement|steel|sand|brick|material/i.test(text)) category = "Materials";
  if (/income|received|client|payment/i.test(text))   category = "Income";
  return category;
}

function assignField(text, workers, projects) {
  const lower = text.toLowerCase();
  const workerMatch  = workers.find(w => lower.includes(w.toLowerCase()));
  const projectMatch = projects.find(p => lower.includes(p.toLowerCase()));
  return { worker: workerMatch || "", project: projectMatch || "" };
}

const categories = ["Wages", "Expense", "Income", "Materials"];
const categoryStyle = {
  Wages:     { bg: "#dbeafe", color: "#1e40af" },
  Expense:   { bg: "#fce7f3", color: "#9d174d" },
  Income:    { bg: "#dcfce7", color: "#166534" },
  Materials: { bg: "#e0e7ff", color: "#3730a3" },
};
const WORKER_PROJECT_MAP = {
  "Suresh - Masonry":    "Block A",
  "Ramesh - Plumbing":   "Block B",
  "Vijay - Electrical":  "Tower C",
};
export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);
  const [listening,   setListening]   = useState(false);
  const [parsing,     setParsing]     = useState(false);
  const [transcript,  setTranscript]  = useState("");
  const [parseSource, setParseSource] = useState("");
  const [pulse,       setPulse]       = useState(true);
  const [worker,    setWorker]    = useState("");
  const [project,   setProject]   = useState("");
  const [category,  setCategory]  = useState("Wages");
  const [amount,    setAmount]    = useState("");
  const [notes,     setNotes]     = useState("");
  const [fieldErrors, setFieldErrors] = useState({ worker: false, project: false });
  const [voiceSaving,  setVoiceSaving]  = useState(false);
  const [voiceSuccess, setVoiceSuccess] = useState("");
  const [voiceError,   setVoiceError]   = useState("");
  const [workerNames,  setWorkerNames]  = useState([]);
  const [projectNames, setProjectNames] = useState([]);
  const [recentEntries,        setRecentEntries]        = useState([]);
  const [recentEntriesLoading, setRecentEntriesLoading] = useState(true);

  const recognitionRef = useRef(null);
  const fetchRecentEntries = () => {
    setRecentEntriesLoading(true);
    transactionAPI.getAll()
      .then(({ data }) => {
        const all = data.transactions || [];
        setRecentEntries(all.slice(0, 5));
      })
      .catch(() => setRecentEntries([]))
      .finally(() => setRecentEntriesLoading(false));
  };

  const handleWorkerChange = (val) => {
    setWorker(val);
    if (fieldErrors.worker) setFieldErrors(prev => ({ ...prev, worker: false }));
    const mapped = WORKER_PROJECT_MAP[val];
    if (mapped && !project) {
      setProject(mapped);
      if (fieldErrors.project) setFieldErrors(prev => ({ ...prev, project: false }));
    }
  };

  const handleProjectChange = (val) => {
    setProject(val);
    if (fieldErrors.project) setFieldErrors(prev => ({ ...prev, project: false }));
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    if (val !== "Wages" && fieldErrors.worker) {
      setFieldErrors(prev => ({ ...prev, worker: false }));
    }
  };

  useEffect(() => {
    workerAPI.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.workers || data.data || []);
        setWorkerNames(list.map(w => w.name || w).filter(Boolean));
      })
      .catch(() => {});

    projectAPI.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.projects || data.data || []);
        setProjectNames(list.map(p => p.projectName || p.name || p).filter(Boolean));
      })
      .catch(() => {});

    // ✅ NEW: fetch real recent entries on mount
    fetchRecentEntries();
  }, []);

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

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const toggleListening = () => {
    if (parsing) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setParsing(true);
      setListening(false);
      recognitionRef.current = null;

      const clientFallback = (t) => {
        const { worker: fw, project: fp } = assignField(t, workerNames, projectNames);
        return { worker: fw, project: fp, amount: extractAmount(t), category: detectCategory(t), notes: t, source: "local" };
      };

      try {
        const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000")
          .replace(/\/+$/, "").replace(/\/api$/, "");
        const res = await fetch(`${apiBase}/api/voice/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text, workers: workerNames, projects: projectNames }),
        });

        let data;
        try { data = await res.json(); } catch { data = clientFallback(text); }
        if (!data.category && !data.worker && !data.amount) data = clientFallback(text);

        const assigned = assignField(text, workerNames, projectNames);
        const parsedWorker   = data.worker   || assigned.worker   || "";
        const parsedProject  = data.project  || assigned.project  || "";
        const parsedAmount   = String(data.amount || "");
        const parsedCategory = data.category || "Expense";
        const parsedNotes    = data.notes    || "";

        const autoProject = parsedProject || (parsedWorker && WORKER_PROJECT_MAP[parsedWorker]) || "";

        setWorker(parsedWorker);
        setProject(autoProject);
        setAmount(parsedAmount);
        setCategory(parsedCategory);
        setNotes(parsedNotes);
        setParseSource(data.source || "");
        setFieldErrors({ worker: false, project: false });
      } catch (err) {
        console.error("Voice parse error:", err);
        const fallback = clientFallback(text);
        const autoProject = fallback.project || (fallback.worker && WORKER_PROJECT_MAP[fallback.worker]) || "";
        setWorker(fallback.worker);
        setProject(autoProject);
        setAmount(String(fallback.amount));
        setCategory(fallback.category);
        setNotes(fallback.notes);
        setParseSource(fallback.source);
        setFieldErrors({ worker: false, project: false });
      } finally {
        setParsing(false);
      }
    };

    recognition.onerror = (e) => {
      console.error("SpeechRecognition error:", e.error);
      setListening(false);
      setParsing(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => { setListening(false); };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const micBg       = parsing ? "#9ca3af" : listening ? "#c2410c" : "#ea580c";
  const micDisabled = parsing;
  const micLabel    = parsing ? "⏳" : "🎤";

  const handleSave = async () => {
    setVoiceError(""); setVoiceSuccess("");

    const newErrors = { worker: false, project: false };
    let errorMsg = "";

    if (!project || !project.trim()) {
      newErrors.project = true;
      errorMsg = "Project is required.";
    }

    if (category === "Wages" && (!worker || !worker.trim())) {
      newErrors.worker = true;
      errorMsg = errorMsg || "Worker is required for wages.";
    }

    if (newErrors.worker || newErrors.project) {
      setFieldErrors(newErrors);
      setVoiceError(errorMsg);
      return;
    }

    const numAmount = Number(String(amount).replace(/,/g, ""));
    if (!amount || numAmount <= 0) {
      setVoiceError("Please enter a valid amount.");
      return;
    }

    try {
      setVoiceSaving(true);
      await transactionAPI.create({
        title:   `${category} - ${worker || project}`,
        amount:  numAmount,
        type:    category,
        worker:  worker,
        project: project,
        date:    new Date().toISOString(),
        notes:   notes || "Entered via Voice Assistant",
      });
      setVoiceSuccess("Entry saved successfully!");
      setWorker(""); setProject(""); setAmount(""); setCategory("Wages"); setNotes("");
      setTranscript(""); setParseSource("");
      setFieldErrors({ worker: false, project: false });
      // ✅ NEW: refresh recent entries after save
      fetchRecentEntries();
      setTimeout(() => setVoiceSuccess(""), 3000);
    } catch (err) {
      setVoiceError(err.response?.data?.message || "Failed to save entry.");
    } finally {
      setVoiceSaving(false);
    }
  };

  const confirmDisabled = voiceSaving || !amount || Number(String(amount).replace(/,/g, "")) <= 0;

  const fieldBox = (hasError = false) => ({
    display: "flex", alignItems: "center",
    background: "#f9f9f9",
    border: `1px solid ${hasError ? "#ef4444" : "#e5e5e5"}`,
    borderRadius: 10, padding: "10px 14px",
    transition: "border-color 0.2s ease",
  });
  const fieldInput = {
    flex: 1, border: "none", background: "transparent",
    outline: "none", fontSize: 14, color: "#1a1a1a", fontWeight: 500,
  };
  const fieldLabel = {
    fontSize: 11, fontWeight: 700, color: "#aaa",
    letterSpacing: "0.08em", marginBottom: 8,
  };

  const isWages = category === "Wages";
  const workerPlaceholder = isWages ? "Select worker" : "Optional worker";

  // ✅ NEW: helper to format time ago
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  return (
    <div style={{
      display: "flex", width: "100%", height: "100vh",
      fontFamily: "'Segoe UI', sans-serif", background: "#faf9f7",
      overflow: "hidden", flex: 1, minWidth: 0,
    }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

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
            <button onClick={() => navigate("/manualentry")}
              style={{ padding: "10px 20px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              📝 Manual Entry
            </button>
            <div style={{ width: 38, height: 38, background: "#fff5f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, border: "1px solid #fde4d0" }}>🔔</div>
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "32px 24px",
          display: "flex", flexDirection: "column", gap: 28, alignItems: "center",
          boxSizing: "border-box", width: "100%",
        }}>

          {/* Mic Button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: -12, borderRadius: "50%",
                background: listening ? "rgba(194,65,12,0.15)" : "rgba(234,88,12,0.12)",
                transform: (listening || pulse) ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.8s ease",
              }} />
              <button
                id="voice-mic-button"
                onClick={toggleListening}
                disabled={micDisabled}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: micBg, border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: micDisabled ? "not-allowed" : "pointer",
                  fontSize: 32, position: "relative", zIndex: 1,
                  boxShadow: "0 8px 24px rgba(234,88,12,0.35)",
                  transition: "background 0.2s ease",
                }}>
                {micLabel}
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a1a" }}>
                {parsing ? "Analysing speech…" : listening ? "Listening…" : "Tap to Start Listening"}
              </h1>
              {transcript ? (
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#555", fontStyle: "italic" }}>"{transcript}"</p>
              ) : !listening && (
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#aaa" }}>
                  Chrome / Edge only · Try: <em>Pay Suresh 1200 for masonry</em>
                </p>
              )}
              {parseSource === "gemini" && (
                <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#ea580c", background: "#fff5f0", padding: "3px 10px", borderRadius: 6, border: "1px solid #fde4d0" }}>✦ AI parsed</span>
              )}
              {parseSource === "local" && (
                <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: 6, border: "1px solid #e5e7eb" }}>local fallback</span>
              )}
            </div>
          </div>

          {/* Review Card */}
          <div style={{ width: "100%", maxWidth: 620, background: "#fff", borderRadius: 18, padding: 28, border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Review &amp; Approve Entry</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", background: "#fff5f0", padding: "4px 12px", borderRadius: 6, letterSpacing: "0.06em", border: "1px solid #fde4d0" }}>LIVE INTERPRETATION</span>
            </div>

            {/* Row 1: Worker + Project */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={fieldLabel}>
                  WORKER{" "}
                  {isWages
                    ? <span style={{ color: "#ea580c" }}>*</span>
                    : <span style={{ color: "#ccc", fontWeight: 400, fontSize: 10 }}>(optional)</span>
                  }
                </div>
                <div style={fieldBox(fieldErrors.worker)}>
                  <input
                    id="voice-worker"
                    value={worker}
                    onChange={e => handleWorkerChange(e.target.value)}
                    placeholder={workerPlaceholder}
                    style={fieldInput}
                  />
                </div>
                {fieldErrors.worker && (
                  <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>
                    Worker is required for wages
                  </div>
                )}
              </div>
              <div>
                <div style={fieldLabel}>
                  PROJECT <span style={{ color: "#ea580c" }}>*</span>
                </div>
                <div style={fieldBox(fieldErrors.project)}>
                  <input
                    id="voice-project"
                    value={project}
                    onChange={e => handleProjectChange(e.target.value)}
                    placeholder="e.g. Block A"
                    style={fieldInput}
                  />
                </div>
                {fieldErrors.project && (
                  <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>
                    Project is required
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Category + Amount */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={fieldLabel}>CATEGORY</div>
                <div style={{ position: "relative" }}>
                  <select
                    id="voice-category"
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 14, color: "#1a1a1a", fontWeight: 500, outline: "none", appearance: "none", cursor: "pointer" }}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>▾</span>
                </div>
              </div>
              <div>
                <div style={fieldLabel}>AMOUNT (₹)</div>
                <div style={fieldBox()}>
                  <span style={{ fontSize: 14, color: "#555", fontWeight: 600, marginRight: 6 }}>₹</span>
                  <input
                    id="voice-amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={fieldInput}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Notes */}
            <div style={{ marginBottom: 20 }}>
              <div style={fieldLabel}>NOTES</div>
              <div style={fieldBox()}>
                <input
                  id="voice-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any additional notes…"
                  style={{ ...fieldInput, width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Row 4: Confirm */}
            <button
              id="voice-confirm-button"
              onClick={handleSave}
              disabled={confirmDisabled}
              style={{ width: "100%", padding: "16px 0", background: confirmDisabled ? "#f59561" : "#ea580c", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: confirmDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 14px rgba(234,88,12,0.3)", marginBottom: 12 }}>
              {voiceSaving ? "⏳ Saving…" : "✅ Confirm & Finalize Entry"}
            </button>
            {voiceSuccess && <div style={{ textAlign: "center", padding: "8px 0", color: "#166534", fontSize: 13, fontWeight: 600 }}>✅ {voiceSuccess}</div>}
            {voiceError   && <div style={{ textAlign: "center", padding: "8px 0", color: "#991b1b", fontSize: 13, fontWeight: 600 }}>⚠️ {voiceError}</div>}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => {
                  setWorker(""); setProject(""); setCategory("Wages"); setAmount(""); setNotes("");
                  setVoiceError(""); setVoiceSuccess(""); setTranscript(""); setParseSource("");
                  setFieldErrors({ worker: false, project: false });
                }}
                style={{ background: "none", border: "none", fontSize: 14, color: "#888", cursor: "pointer", fontWeight: 500 }}>
                Discard &amp; Try Again
              </button>
            </div>
          </div>

          {/* ✅ Recent Voice Entries — now real data */}
          <div style={{ width: "100%", maxWidth: 880 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Recent Voice Entries</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                  {[12, 18, 14, 22, 16, 20, 14].map((h, i) => (
                    <div key={i} style={{ width: 4, height: pulse ? h : h * 0.6, background: "#ea580c", borderRadius: 3, transition: "height 0.4s ease", transitionDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
                <span
                  onClick={() => navigate("/transaction")}
                  style={{ fontSize: 13, color: "#ea580c", fontWeight: 600, cursor: "pointer" }}>
                  View History
                </span>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              {!isMobile && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr", padding: "12px 20px", borderBottom: "1px solid #f0f0f0" }}>
                  {["TITLE / PROJECT", "CATEGORY", "AMOUNT (₹)", "STATUS"].map(col => (
                    <div key={col} style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em" }}>{col}</div>
                  ))}
                </div>
              )}

              {recentEntriesLoading ? (
                <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 14 }}>Loading…</div>
              ) : recentEntries.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: "#aaa", fontSize: 14 }}>No entries yet</div>
              ) : recentEntries.map((t, i) => {
                const style = categoryStyle[t.type] || { bg: "#f5f5f5", color: "#555" };
                const isIncome = t.type === "Income";
                return !isMobile ? (
                  <div key={t._id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr", padding: "16px 20px", borderBottom: i < recentEntries.length - 1 ? "1px solid #f9f9f9" : "none", alignItems: "center" }}
                    onMouseEnter={ev => ev.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{timeAgo(t.date)}</div>
                    </div>
                    <div>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: style.bg, color: style.color, letterSpacing: "0.04em" }}>{t.type?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isIncome ? "#16a34a" : "#1a1a1a" }}>
                      {isIncome ? "+" : "-"}₹{t.amount?.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 20 }}>✅</div>
                  </div>
                ) : (
                  <div key={t._id} style={{ padding: "14px 16px", borderBottom: i < recentEntries.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{timeAgo(t.date)}</div>
                      </div>
                      <span style={{ fontSize: 18 }}>✅</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: style.bg, color: style.color }}>{t.type?.toUpperCase()}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isIncome ? "#16a34a" : "#1a1a1a" }}>
                        {isIncome ? "+" : "-"}₹{t.amount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}