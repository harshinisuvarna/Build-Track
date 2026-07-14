import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI, workerAPI, projectAPI, voiceAPI } from "../api";
import { colors, radius, spacing, shadows, typography } from "../styles/designTokens";

const STATUS = {
  idle: "idle",
  listening: "listening",
  processing: "processing",
  thinking: "thinking",
  extracting: "extracting",
  waitingForUser: "waiting_for_user",
  summary: "summary",
  saving: "saving",
  completed: "completed",
  error: "error",
};

const ENTRY_TYPES = ["material", "labour", "equipment"];

const FIELD_DEFS = {
  material: [
    { key: "Item Name", label: "Material", required: true },
    { key: "Quantity", label: "Quantity", required: true, unit: true },
    { key: "Unit", label: "Unit", required: true },
    { key: "Rate", label: "Rate (\u20B9)", required: true, prefix: "\u20B9" },
    { key: "Brand", label: "Brand", required: false },
    { key: "Floor", label: "Floor", required: false },
    { key: "Phase", label: "Phase", required: false },
    { key: "Activity", label: "Activity", required: false },
  ],
  labour: [
    { key: "Labour Type", label: "Labour Type", required: true, options: ["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Helper", "Supervisor", "Other"] },
    { key: "Worker Count", label: "Workers", required: true },
    { key: "Hours Worked", label: "Hours", required: true },
    { key: "Rate", label: "Rate (\u20B9)", required: true, prefix: "\u20B9" },
    { key: "Floor", label: "Floor", required: false },
    { key: "Phase", label: "Phase", required: false },
    { key: "Activity", label: "Activity", required: false },
  ],
  equipment: [
    { key: "Equipment", label: "Equipment", required: true },
    { key: "Hours Used", label: "Hours", required: true },
    { key: "Rate", label: "Rate (\u20B9)", required: true, prefix: "\u20B9" },
    { key: "Floor", label: "Floor", required: false },
    { key: "Phase", label: "Phase", required: false },
    { key: "Activity", label: "Activity", required: false },
  ],
};

const ENTRY_EXAMPLES = {
  material: 'Say: "20 bags of UltraTech cement at 420 rupees per bag"',
  labour: 'Say: "8 masons worked 9 hours at 850 rupees per hour"',
  equipment: 'Say: "JCB excavator worked 6 hours at 1200 rupees per hour"',
};

const FIELD_VALUE_LABELS = {
  "Item Name": "itemName",
  "Labour Type": "labourType",
  Equipment: "equipment",
};

const STATUS_TITLES = {
  [STATUS.idle]: "BuildTrack AI",
  [STATUS.listening]: "BuildTrack AI",
  [STATUS.processing]: "AI is Thinking...",
  [STATUS.thinking]: "AI is Thinking...",
  [STATUS.extracting]: "Extracted Information",
  [STATUS.waitingForUser]: "AI Assistant",
  [STATUS.summary]: "AI Assistant",
  [STATUS.saving]: "AI Assistant",
  [STATUS.completed]: "Success",
  [STATUS.error]: "Error",
};

const STATUS_SUBTITLES = {
  [STATUS.idle]: "AI Voice Entry \u2022 Material / Labour / Equipment",
  [STATUS.listening]: "AI Voice Entry \u2022 Material / Labour / Equipment",
  [STATUS.processing]: "Analyzing voice input",
  [STATUS.thinking]: "Analyzing voice input",
  [STATUS.extracting]: "Review detected details",
  [STATUS.waitingForUser]: "Smart conversational flow",
  [STATUS.summary]: "Review & confirm entry",
  [STATUS.saving]: "Saving entry...",
  [STATUS.completed]: "Entry saved successfully",
  [STATUS.error]: "Something went wrong",
};

function extractAmount(text) {
  const t = text.toLowerCase();
  const lakhMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const croreMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)/i);
  const thousandMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/i);
  const plainMatch = t.match(/\d[\d,]*/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
  if (croreMatch) return Math.round(parseFloat(croreMatch[1]) * 10000000);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1000);
  if (plainMatch) return Number(plainMatch[0].replace(/,/g, ""));
  return 0;
}

function detectNumber(text) {
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function detectFieldValue(fieldKey, text) {
  const lower = text.toLowerCase();
  switch (fieldKey) {
    case "Item Name": {
      const known = ["cement", "steel", "sand", "brick", "aggregate", "tile", "paint", "wood", "pipe", "wire", "rod", "concrete", "block"];
      for (const k of known) {
        if (lower.includes(k)) return k.charAt(0).toUpperCase() + k.slice(1);
      }
      return null;
    }
    case "Labour Type": {
      const types = ["mason", "carpenter", "electrician", "plumber", "painter", "helper", "supervisor"];
      for (const t of types) {
        if (lower.includes(t)) return t.charAt(0).toUpperCase() + t.slice(1);
      }
      return null;
    }
    case "Equipment": {
      const eq = ["jcb", "excavator", "crane", "mixer", "vibrator", "compressor", "generator", "roller", "dozer", "backhoe"];
      for (const e of eq) {
        if (lower.includes(e)) return e.charAt(0).toUpperCase() + e.slice(1);
      }
      return null;
    }
    case "Quantity": return detectNumber(text);
    case "Worker Count": return detectNumber(text);
    case "Hours Worked": return detectNumber(text);
    case "Hours Used": return detectNumber(text);
    case "Rate": return extractAmount(text) || detectNumber(text);
    case "Brand": {
      const brands = ["ultratech", "acc", "ambuja", "jsw", "tata", "birla", "bajaj", "jaquar", "asian", "berger"];
      for (const b of brands) {
        if (lower.includes(b)) return b.charAt(0).toUpperCase() + b.slice(1);
      }
      return null;
    }
    default: return null;
  }
}

function extractFields(type, transcript) {
  const fields = {};
  const defs = FIELD_DEFS[type] || [];
  for (const def of defs) {
    const val = detectFieldValue(def.key, transcript);
    if (val !== null && val !== undefined && val !== "") {
      fields[def.key] = val;
    }
  }
  return fields;
}

function computeAmount(type, fields) {
  if (type === "material") {
    const qty = parseFloat(fields["Quantity"]) || 0;
    const rate = parseFloat(fields["Rate"]) || 0;
    return qty * rate;
  }
  if (type === "labour") {
    const count = parseFloat(fields["Worker Count"]) || 0;
    const hours = parseFloat(fields["Hours Worked"]) || 0;
    const rate = parseFloat(fields["Rate"]) || 0;
    return count * hours * rate;
  }
  if (type === "equipment") {
    const hours = parseFloat(fields["Hours Used"]) || 0;
    const rate = parseFloat(fields["Rate"]) || 0;
    return hours * rate;
  }
  return 0;
}

function missingFields(type, fields) {
  const defs = FIELD_DEFS[type] || [];
  return defs
    .filter(d => d.required && (!fields[d.key] || String(fields[d.key]).trim() === ""))
    .map(d => d.key);
}

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const [entryType, setEntryType] = useState("material");
  const [status, setStatus] = useState(STATUS.idle);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [detectedFields, setDetectedFields] = useState({});
  const [editing, setEditing] = useState(false);
  const [workerOptions, setWorkerOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [workerNames, setWorkerNames] = useState([]);
  const [projectNames, setProjectNames] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [processingStage, setProcessingStage] = useState(0);
  const [timer, setTimer] = useState(0);
  const [computedAmt, setComputedAmt] = useState(0);
  const [question, setQuestion] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [answerText, setAnswerText] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [askingField, setAskingField] = useState("");
  const [editFields, setEditFields] = useState({});

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const processTimerRef = useRef(null);

  const micBtnRef = useRef(null);

  const navigateTo = useNavigate();

  const fetchRecentEntries = useCallback(() => {
    setRecentLoading(true);
    transactionAPI.getAll()
      .then(({ data }) => {
        const all = data.transactions || [];
        setRecentEntries(all.slice(0, 5));
      })
      .catch(() => setRecentEntries([]))
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    workerAPI.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.workers || data.data || []);
        setWorkerOptions(list);
        setWorkerNames(list.map(w => w.name || w).filter(Boolean));
      })
      .catch(() => {});
    projectAPI.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.projects || data.data || []);
        setProjectOptions(list);
        setProjectNames(list.map(p => p.projectName || p.name || p).filter(Boolean));
      })
      .catch(() => {});
    fetchRecentEntries();
  }, [fetchRecentEntries]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      clearInterval(timerRef.current);
      clearInterval(processTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (status === STATUS.listening) {
      const start = Date.now();
      timerRef.current = setInterval(() => setTimer(Math.floor((Date.now() - start) / 1000)), 200);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
      if (status !== STATUS.processing && status !== STATUS.thinking) setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  useEffect(() => {
    if (status === STATUS.processing || status === STATUS.thinking) {
      setProcessingStage(0);
      processTimerRef.current = setInterval(() => {
        setProcessingStage(prev => {
          const max = FIELD_DEFS[entryType]?.length || 5;
          if (prev >= max + 2) {
            clearInterval(processTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    } else {
      clearInterval(processTimerRef.current);
      processTimerRef.current = null;
    }
    return () => clearInterval(processTimerRef.current);
  }, [status, entryType]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSaveError("Voice input not supported in this browser. Use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
        else interimText += event.results[i][0].transcript;
      }
      if (finalText.trim()) {
        setTranscript(prev => prev + " " + finalText.trim());
        setStatus(STATUS.processing);
        recognition.stop();
        recognitionRef.current = null;
        const fullText = (transcript + " " + finalText).trim();
        processTranscript(fullText || finalText.trim());
      }
      if (interimText.trim()) {
        setPartialTranscript(interimText.trim());
      }
    };

    recognition.onerror = () => {
      setStatus(STATUS.idle);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      if (status === STATUS.listening) {
        setStatus(STATUS.idle);
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus(STATUS.listening);
    setPartialTranscript("");
  }, [status, transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (status === STATUS.listening) {
      setStatus(STATUS.idle);
    }
  }, [status]);

  const processTranscript = useCallback(async (text) => {
    setStatus(STATUS.thinking);
    let fields = extractFields(entryType, text);
    try {
      const { data } = await voiceAPI.parse({
        transcript: text,
        workers: workerNames,
        projects: projectNames,
        entryType,
      });
      if (data && data.fields) {
        fields = { ...fields, ...data.fields };
      }
    } catch {
      // Use local extraction as fallback
    }
    setDetectedFields(fields);
    setComputedAmt(computeAmount(entryType, fields));
    setStatus(STATUS.extracting);
    const missing = missingFields(entryType, fields);
    if (missing.length > 0) {
      const nextField = missing[0];
      setAskingField(nextField);
      const def = FIELD_DEFS[entryType]?.find(d => d.key === nextField);
      setQuestion(`What is the ${def?.label || nextField}?`);
      setSuggestions(def?.options || generateSuggestions(entryType, nextField));
      setStatus(STATUS.waitingForUser);
    } else {
      setStatus(STATUS.summary);
    }
  }, [entryType, workerNames, projectNames]);

  function generateSuggestions(type, fieldKey) {
    if (fieldKey === "Unit") return ["Bags", "Kg", "Tonnes", "Pieces", "Feet", "Sq.Ft"];
    if (fieldKey === "Labour Type") return ["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Helper"];
    if (fieldKey === "Equipment") return ["JCB", "Excavator", "Crane", "Mixer", "Compressor", "Generator"];
    if (fieldKey === "Brand") return ["UltraTech", "ACC", "Ambuja", "Tata", "Birla"];
    if (fieldKey === "Activity") return ["Foundation", "Slab", "Plaster", "Flooring", "Painting", "Plumbing", "Electrical", "Finishing"];
    if (fieldKey === "Phase") return ["Phase 1", "Phase 2", "Phase 3"];
    if (fieldKey === "Floor") return ["Ground", "1st", "2nd", "3rd", "4th", "5th", "Terrace"];
    return [];
  }

  const selectSuggestion = useCallback((val) => {
    const updated = { ...detectedFields, [askingField]: val };
    setDetectedFields(updated);
    setComputedAmt(computeAmount(entryType, updated));
    const missing = missingFields(entryType, updated);
    if (missing.length > 0) {
      const next = missing[0];
      setAskingField(next);
      const def = FIELD_DEFS[entryType]?.find(d => d.key === next);
      setQuestion(`What is the ${def?.label || next}?`);
      setSuggestions(def?.options || generateSuggestions(entryType, next));
    } else {
      setQuestion("");
      setAskingField("");
      setStatus(STATUS.summary);
    }
    setAnswerText("");
  }, [detectedFields, askingField, entryType]);

  const handleAnswerSubmit = useCallback(() => {
    if (!answerText.trim()) return;
    selectSuggestion(answerText.trim());
  }, [answerText, selectSuggestion]);

  const startAnswerListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final.trim()) {
        selectSuggestion(final.trim());
        recognition.stop();
      }
    };
    recognition.onerror = () => recognition.stop();
    recognition.start();
  }, [selectSuggestion]);

  const handleSave = useCallback(async () => {
    setStatus(STATUS.saving);
    setSaveError("");
    try {
      const amount = computedAmt || extractAmount(transcript);
      const typeMap = { material: "Materials", labour: "Wages", equipment: "Expense" };
      await transactionAPI.create({
        title: `${typeMap[entryType]} - ${detectedFields["Item Name"] || detectedFields["Labour Type"] || detectedFields["Equipment"] || "Voice Entry"}`,
        amount,
        type: typeMap[entryType] || "Expense",
        date: new Date().toISOString(),
        notes: transcript || "Entered via Voice Assistant",
      });
      setStatus(STATUS.completed);
      fetchRecentEntries();
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save entry");
      setStatus(STATUS.summary);
    }
  }, [computedAmt, transcript, detectedFields, entryType, fetchRecentEntries]);

  const resetAll = useCallback(() => {
    setStatus(STATUS.idle);
    setTranscript("");
    setPartialTranscript("");
    setDetectedFields({});
    setEditing(false);
    setSaveError("");
    setSaveSuccess("");
    setQuestion("");
    setSuggestions([]);
    setAnswerText("");
    setShowKeyboard(false);
    setAskingField("");
    setComputedAmt(0);
    setProcessingStage(0);
    clearInterval(timerRef.current);
    timerRef.current = null;
    setTimer(0);
  }, []);

  const toggleListening = useCallback(() => {
    if (status === STATUS.listening) stopListening();
    else startListening();
  }, [status, startListening, stopListening]);

  const isListening = status === STATUS.listening;
  const currentDefs = FIELD_DEFS[entryType] || [];
  const completedCount = currentDefs.filter(d => detectedFields[d.key] && String(detectedFields[d.key]).trim() !== "").length;
  const totalCount = currentDefs.length;
  const isComplete = completedCount === totalCount && totalCount > 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const cardStyles = {
    background: colors.cardBg,
    borderRadius: radius.lg,
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: shadows.card,
    width: "100%",
    maxWidth: 680,
  };

  const processingStages = currentDefs.map(d => d.label);

  const showStatusBadge = isListening;
  const topLabel = STATUS_TITLES[status] || "BuildTrack AI";
  const topSub = STATUS_SUBTITLES[status] || "";

  const isRecordingState = status === STATUS.idle || status === STATUS.listening;
  const isProcessingState = status === STATUS.processing || status === STATUS.thinking;
  const isExtractingState = status === STATUS.extracting;
  const isAskingState = status === STATUS.waitingForUser;
  const isSummaryState = status === STATUS.summary || status === STATUS.saving;
  const isCompletedState = status === STATUS.completed;
  const isErrorState = status === STATUS.error;

  const shouldShowBottomArea = isRecordingState || isAskingState;
  const showRevBottom = isSummaryState;

  return (
    <div style={{
      display: "flex", width: "100%", height: "100vh",
      fontFamily: typography.fontFamily, background: colors.bgBase4,
      overflow: "hidden", flex: 1, minWidth: 0,
      flexDirection: "column",
    }}>
      <style>{`
        @keyframes waveAnim {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes micPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.25; }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(23,62,234,0.3); }
          50% { box-shadow: 0 0 24px rgba(177,55,255,0.5); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes barWave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .voice-card { animation: slideUp 0.35s ease; }
        .fade-in { animation: fadeIn 0.3s ease; }
        .processing-check { animation: fadeIn 0.25s ease; }
        .wave-bar {
          animation: barWave 1s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>

      {/* Top Bar */}
      <div style={{
        background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`,
        padding: "14px 24px", display: "flex", alignItems: "center",
        gap: 12, flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate("/dashboard")}
          style={{ background: colors.bgBase4, border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: colors.textPrimary }}>
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{topLabel}</div>
          <div style={{ fontSize: 11, color: colors.textLight, fontWeight: 500 }}>{topSub}</div>
        </div>
        {showStatusBadge && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 20,
            background: isListening ? "#FEE2E2" : colors.bgBase4,
            border: `1px solid ${isListening ? "#FCA5A5" : colors.cardBorder}`,
            fontSize: 11, fontWeight: 600,
            color: isListening ? "#DC2626" : colors.textLight,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isListening ? "#EF4444" : colors.textLight }} />
            {isListening ? "Listening" : "Ready"}
          </div>
        )}
      </div>

      {/* Main scrollable body */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "24px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 20, paddingBottom: shouldShowBottomArea ? 160 : isSummaryState ? 120 : 40,
      }}>
        {/* ===== RECORDING STATE (idle / listening) ===== */}
        {isRecordingState && (
          <>
            {/* Entry type tabs */}
            {status === STATUS.idle && (
              <div className="voice-card" style={{
                ...cardStyles, padding: "20px 24px", maxWidth: 400,
                display: "flex", gap: 8,
              }}>
                {ENTRY_TYPES.map(t => (
                  <button key={t} onClick={() => setEntryType(t)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: radius.sm, border: "none",
                      fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize",
                      background: entryType === t ? `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.primaryPurple})` : colors.bgBase4,
                      color: entryType === t ? "#FFF" : colors.textSecondary, transition: "all 0.2s",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Waveform + Transcript */}
            <div className="voice-card" style={{
              ...cardStyles, padding: "24px", textAlign: "center",
            }}>
              {isListening && (
                <div style={{ fontSize: 10, fontWeight: 700, color: colors.primaryBlue, letterSpacing: "0.1em", marginBottom: 12 }}>
                  LIVE TRANSCRIPT
                </div>
              )}
              {isListening ? (
                <>
                  <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="wave-bar"
                        style={{
                          width: 3, borderRadius: 2,
                          height: `${4 + Math.abs(Math.sin((i * Math.PI) / 10 + Date.now() * 0.001)) * 20}px`,
                          background: `linear-gradient(to top, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                          animationDelay: `${i * 0.08}s`,
                        }} />
                    ))}
                  </div>
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.primaryBlue}15, ${colors.primaryPurple}15)`,
                    borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`,
                    padding: "14px 18px", fontSize: 14, color: colors.textPrimary, fontWeight: 500,
                    lineHeight: 1.5,
                  }}>
                    {partialTranscript || transcript || "Listening for voice input..."}
                  </div>
                </>
              ) : (
                <div style={{ padding: "16px 0" }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
                    background: `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: `0 8px 24px ${colors.primaryBlue}40`,
                    transition: "transform 0.2s", fontSize: 32,
                  }} onClick={toggleListening}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, marginBottom: 8 }}>
                    Tap to Start Listening
                  </div>
                  <div style={{ fontSize: 13, color: colors.textLight }}>
                    Chrome / Edge only
                  </div>
                </div>
              )}
            </div>

            {/* Example Hint */}
            {status === STATUS.idle && (
              <div className="voice-card" style={{
                ...cardStyles, padding: "16px 20px", maxWidth: 680,
                background: colors.primarySurface, border: `1px solid ${colors.cardBorder}`,
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M9 18h6" /><path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.primaryBlue, marginBottom: 4 }}>Example Phrase:</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, fontStyle: "italic" }}>
                    {ENTRY_EXAMPLES[entryType]}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== PROCESSING / THINKING STATE ===== */}
        {isProcessingState && (
          <div className="voice-card" style={{ ...cardStyles, padding: "24px", maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: colors.primarySurface,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>BuildTrack AI</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: colors.primarySurface, color: colors.primaryBlue, letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}>{entryType}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.primaryBlue }}>
                  {status === STATUS.processing ? "Processing..." : "Thinking..."}
                </div>
              </div>
            </div>
            <div style={{
              borderRadius: radius.md, background: colors.bgBase4,
              padding: 16, marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 12 }}>
                Extracting details...
              </div>
              {processingStages.slice(0, 7).map((label, i) => {
                let icon;
                if (processingStage > i + 1) icon = "completed";
                else if (processingStage === i + 1) icon = "current";
                else icon = "pending";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: icon === "pending" ? 0.4 : 1 }}>
                    <div style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {icon === "completed" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.success} stroke="white" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="8 12 11 15 16 9" fill="none" stroke="white" strokeWidth="2" />
                        </svg>
                      ) : icon === "current" ? (
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${colors.primaryBlue}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }}>
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                      ) : (
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${colors.textLight}` }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: icon === "current" ? 700 : 500, color: colors.textPrimary }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{
              background: colors.primarySurface, borderRadius: radius.md,
              border: `1px solid ${colors.cardBorder}`, padding: "12px 16px",
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M9 18h6" /><path d="M10 22h4" />
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
              </svg>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>You can keep the app open while we process your voice input</span>
            </div>
          </div>
        )}

        {/* ===== EXTRACTING / WAITING_FOR_USER STATES ===== */}
        {(isExtractingState || isAskingState) && (
          <>
            {/* AI Understanding Panel */}
            <div className="voice-card" style={{ ...cardStyles, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>AI Understanding Entry</span>
                <span style={{
                  padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: isComplete ? colors.badgeSuccessBg : colors.primarySurface,
                  color: isComplete ? colors.badgeSuccessText : colors.primaryBlue,
                }}>
                  {completedCount} / {totalCount}
                </span>
              </div>
              <div style={{
                height: 4, borderRadius: 4, background: colors.bgBase4, marginBottom: 16,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.4s ease",
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {currentDefs.map(def => {
                  const hasVal = detectedFields[def.key] && String(detectedFields[def.key]).trim() !== "";
                  return (
                    <div key={def.key} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", borderRadius: 10,
                      background: hasVal ? "#DCFCE7" : colors.bgBase4,
                      border: `1px solid ${hasVal ? "#BBF7D0" : colors.cardBorder}`,
                      fontSize: 11.5, fontWeight: 600,
                      color: hasVal ? "#16A34A" : colors.textSecondary,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={hasVal ? "#16A34A" : "none"} stroke={hasVal ? "white" : colors.textLight} strokeWidth={hasVal ? "2.5" : "1.5"}>
                        {hasVal
                          ? <><circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" /></>
                          : <circle cx="12" cy="12" r="8" />
                        }
                      </svg>
                      {hasVal ? `${def.label}: ${detectedFields[def.key]}` : def.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Question Chat Bubble */}
            {isAskingState && question && (
              <div className="voice-card fade-in" style={{
                width: "100%", maxWidth: 680,
                borderRadius: radius.xl, overflow: "hidden",
                background: `linear-gradient(135deg, ${colors.primaryBlue}, #7B3FE4)`,
                boxShadow: `0 4px 20px ${colors.primaryBlue}30`,
              }}>
                <div style={{ padding: "16px 20px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>
                    BuildTrack AI
                  </div>
                  {Object.entries(detectedFields).filter(([, v]) => v && String(v).trim()).length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Great, I found:</div>
                      {Object.entries(detectedFields).filter(([, v]) => v && String(v).trim()).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#22C55E" stroke="white" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" fill="none" stroke="white" strokeWidth="2" />
                          </svg>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{k}: {String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.15)", marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#FFF", lineHeight: 1.4, marginBottom: 12 }}>
                    {question}
                  </div>
                </div>
                {suggestions.length > 0 && (
                  <div style={{ padding: "8px 20px 16px", background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 600 }}>
                      Quick answers:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => selectSuggestion(s)}
                          style={{
                            padding: "6px 14px", borderRadius: 20,
                            background: "rgba(255,255,255,0.15)", border: `1px solid rgba(255,255,255,0.35)`,
                            color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            transition: "background 0.15s",
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== SUMMARY STATE ===== */}
        {isSummaryState && (
          <div className="voice-card" style={{ width: "100%", maxWidth: 680 }}>
            {/* Header */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.primaryBlue}, #7B3FE4)`,
              borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
              padding: "24px 28px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em" }}>ENTRY SUMMARY</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#FFF", marginBottom: 2 }}>
                ₹{computedAmt.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>
                {detectedFields["Item Name"] || detectedFields["Labour Type"] || detectedFields["Equipment"] || "Voice Entry"} &middot; {entryType}
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "20px 28px" }}>
              {!editing && currentDefs.map((def, i) => {
                const val = detectedFields[def.key];
                const isAmt = def.key === "Rate";
                const isHighlighted = def.key === "Rate" || def.key === "Amount";
                return (
                  <div key={def.key}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: colors.textLight, letterSpacing: "0.08em", marginBottom: 2, textTransform: "uppercase" }}>
                      {def.label}
                    </div>
                    <div style={{
                      fontSize: isHighlighted ? 18 : 14.5,
                      fontWeight: 700, color: isHighlighted ? colors.primaryBlue : colors.textPrimary,
                      padding: "4px 0 10px",
                    }}>
                      {def.prefix || ""}{val || "-"}
                    </div>
                    {i < currentDefs.length - 1 && <div style={{ height: 1, background: colors.bgBase4, marginBottom: 12 }} />}
                  </div>
                );
              })}
              {!editing && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: colors.textLight, letterSpacing: "0.08em", marginBottom: 2, textTransform: "uppercase" }}>
                    Amount
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: colors.primaryBlue, padding: "4px 0 0" }}>
                    ₹{computedAmt.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>

            {saveError && (
              <div style={{ margin: "0 28px 16px", padding: "10px 14px", borderRadius: radius.sm, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: "16px 28px 24px", display: "flex", gap: 12 }}>
              <button onClick={() => setEditing(!editing)}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: radius.md,
                  border: `1.5px solid ${colors.cardBorder}`, background: "transparent",
                  color: colors.textPrimary, fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}>
                {editing ? "Cancel" : "Edit Details"}
              </button>
              <button onClick={handleSave} disabled={status === STATUS.saving}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: radius.md, border: "none",
                  background: `linear-gradient(90deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                  color: "#FFF", fontWeight: 700, fontSize: 14, cursor: status === STATUS.saving ? "not-allowed" : "pointer",
                  opacity: status === STATUS.saving ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {status === STATUS.saving ? (
                  <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", animation: "spin 0.7s linear infinite" }} /> Saving...</>
                ) : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}

        {/* ===== COMPLETED STATE ===== */}
        {isCompletedState && (
          <div className="voice-card fade-in" style={{ ...cardStyles, padding: "32px 28px", textAlign: "center", maxWidth: 500 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
              background: `linear-gradient(135deg, #22C55E, #10B981)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary, marginBottom: 6 }}>
              Entry Saved Successfully!
            </div>
            <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 20 }}>
              Your {entryType} entry has been saved and recorded.
            </div>
            <div style={{
              background: "#F0FDF4", borderRadius: radius.lg,
              border: "1px solid #BBF7D0", padding: "16px 20px", marginBottom: 24,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: colors.textLight, fontWeight: 500 }}>Type</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary, textTransform: "capitalize" }}>{entryType}</span>
              </div>
              <div style={{ height: 1, background: "#DCFCE7", marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: colors.textLight, fontWeight: 500 }}>Amount</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary }}>₹{computedAmt.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <button onClick={resetAll}
              style={{
                width: "100%", padding: "15px 0", borderRadius: radius.md, border: "none",
                background: `linear-gradient(90deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                color: "#FFF", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10,
              }}>
              Add Another Entry
            </button>
            <button onClick={() => navigate("/transaction")}
              style={{
                width: "100%", padding: "14px 0", borderRadius: radius.md,
                border: `1.5px solid ${colors.primaryBlue}`, background: "transparent",
                color: colors.primaryBlue, fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
              View All Entries
            </button>
          </div>
        )}

        {/* Recent Entries (always visible when not processing/completed) */}
        {!isProcessingState && !isCompletedState && status !== STATUS.saving && (
          <div style={{ width: "100%", maxWidth: 680 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Recent Entries</h3>
              <span onClick={() => navigate("/transaction")}
                style={{ fontSize: 12, color: colors.primaryBlue, fontWeight: 600, cursor: "pointer" }}>
                View History
              </span>
            </div>
            <div style={{ background: colors.cardBg, borderRadius: radius.lg, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
              {recentLoading ? (
                <div style={{ padding: 30, textAlign: "center", color: colors.textLight, fontSize: 13 }}>Loading...</div>
              ) : recentEntries.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: colors.textLight, fontSize: 13 }}>No entries yet</div>
              ) : recentEntries.map((t, i) => {
                const typeLabel = t.type || "Expense";
                const typeColor = typeLabel === "Materials" ? colors.primaryBlue : typeLabel === "Wages" ? "#D97706" : typeLabel === "Income" ? colors.success : colors.textSecondary;
                const typeBg = typeLabel === "Materials" ? colors.primarySurface : typeLabel === "Wages" ? "#FFFBEB" : typeLabel === "Income" ? "#F0FDF4" : colors.bgBase4;
                return (
                  <div key={t._id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 20px", borderBottom: i < recentEntries.length - 1 ? `1px solid ${colors.bgBase4}` : "none",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: colors.textLight }}>{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: typeBg, color: typeColor,
                    }}>{typeLabel.toUpperCase()}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: typeLabel === "Income" ? colors.success : colors.textPrimary, marginLeft: 16, minWidth: 70, textAlign: "right" }}>
                      {typeLabel === "Income" ? "+" : "-"}₹{(t.amount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM INPUT AREA ===== */}
      {shouldShowBottomArea && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: colors.cardBg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 20,
          padding: "16px 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        }}>
          {isAskingState ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 680, margin: "0 auto" }}>
              <button onClick={() => setShowKeyboard(!showKeyboard)}
                style={{
                  width: 44, height: 44, borderRadius: "50%", border: "none",
                  background: showKeyboard ? colors.primarySurface : colors.bgBase4,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showKeyboard ? colors.primaryBlue : colors.textSecondary} strokeWidth="2">
                  {showKeyboard
                    ? <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" /></>
                    : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
                  }
                </svg>
              </button>
              {showKeyboard ? (
                <>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAnswerSubmit()}
                      placeholder={`Type ${askingField ? FIELD_DEFS[entryType]?.find(d => d.key === askingField)?.label || askingField : "answer"}...`}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`,
                        background: colors.bgBase4, fontSize: 14, color: colors.textPrimary, outline: "none",
                      }}
                    />
                  </div>
                  <button onClick={handleAnswerSubmit}
                    style={{
                      width: 44, height: 44, borderRadius: "50%", border: "none",
                      background: `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
                  <button onClick={startAnswerListening}
                    style={{
                      width: 56, height: 56, borderRadius: "50%", border: "none",
                      background: `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      boxShadow: `0 4px 16px ${colors.primaryPurple}50`,
                    }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, maxWidth: 680, margin: "0 auto" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.textLight, display: "flex", alignItems: "center", gap: 6 }}>
                {isListening ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", animation: "micPulse 1s infinite" }} />
                    {formatTime(timer)} Listening
                  </span>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Ready To Record
                  </>
                )}
              </div>
              <button onClick={toggleListening}
                style={{
                  width: 56, height: 56, borderRadius: "50%", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  transition: "all 0.2s",
                  background: isListening ? "#EF4444" : `linear-gradient(135deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                  boxShadow: isListening
                    ? "0 0 0 4px rgba(239,68,68,0.2)"
                    : `0 4px 16px ${colors.primaryBlue}40`,
                }}>
                {isListening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
              <div style={{ minWidth: 100, textAlign: "right" }}>
                {isListening && (
                  <button onClick={stopListening}
                    style={{
                      padding: "8px 16px", borderRadius: radius.md, border: `1.5px solid ${colors.error}`,
                      background: "transparent", color: colors.error, fontWeight: 600, fontSize: 12,
                      cursor: "pointer",
                    }}>
                    Stop & Analyze
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary bottom area */}
      {showRevBottom && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: colors.cardBg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 20,
          padding: "12px 24px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}>
          <div style={{ display: "flex", gap: 12, maxWidth: 680, margin: "0 auto" }}>
            <button onClick={resetAll}
              style={{
                flex: 1, padding: "14px 0", borderRadius: radius.md, border: `1.5px solid ${colors.cardBorder}`,
                background: "transparent", color: colors.textPrimary, fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
              Discard
            </button>
            <button onClick={handleSave} disabled={status === STATUS.saving}
              style={{
                flex: 1, padding: "14px 0", borderRadius: radius.md, border: "none",
                background: `linear-gradient(90deg, ${colors.primaryBlue}, ${colors.primaryPurple})`,
                color: "#FFF", fontWeight: 700, fontSize: 14,
                cursor: status === STATUS.saving ? "not-allowed" : "pointer",
                opacity: status === STATUS.saving ? 0.7 : 1,
              }}>
              {status === STATUS.saving ? "Saving..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
