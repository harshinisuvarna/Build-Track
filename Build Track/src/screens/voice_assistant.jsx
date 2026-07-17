import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { transactionAPI, projectAPI, voiceAPI } from '../api';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { parseTranscript, computeAmount } from '../utils/voiceParser';
import { createElement } from 'react';
import { colors, radius, shadows, typography } from '../styles/designTokens';
import { Package, User, Wrench, Building2, MapPin, ClipboardList, Hammer } from 'lucide-react';
import ExecutionContextStep from '../components/ExecutionContextStep';
import VoiceReviewSheet from '../components/VoiceReviewSheet';

// ---------------------------------------------------------------------------
// Voice Assistant — Full Flutter ai_voice_entry_screen.dart parity
//
// Flow:  ExecutionContext → Voice Recording → AI Parse → Review/Edit → Save
// ---------------------------------------------------------------------------

const STATUS = {
  context: 'context',       // pre-step: project/floor/phase/activity
  idle: 'idle',
  listening: 'listening',
  processing: 'processing',
  extracting: 'extracting',
  summary: 'summary',
  editing: 'editing',
  saving: 'saving',
  completed: 'completed',
  error: 'error',
};

const ENTRY_TYPES = [
  { id: 'material', label: 'Material', icon: 'material', color: '#7c3aed' },
  { id: 'labor', label: 'Labor', icon: 'labor', color: '#0891b2' },
  { id: 'equipment', label: 'Equipment', icon: 'equipment', color: '#d97706' },
];

const typeIcons = {
  material: Package,
  labor: User,
  equipment: Wrench,
};

const ENTRY_EXAMPLES = {
  material: 'Say: "20 bags of UltraTech cement at 420 rupees per bag"',
  labour: 'Say: "8 masons worked 9 hours at 850 per day"',
  equipment: 'Say: "JCB excavator worked 6 hours at 1200 per hour, diesel 500"',
};

export default function VoiceAssistantPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedProject = location.state?.project || null;

  // --- State ---
  const [status, setStatus] = useState(preselectedProject ? STATUS.idle : STATUS.context);
  const [entryType, setEntryType] = useState('material');
  const [executionContext, setExecutionContext] = useState({
    project: preselectedProject,
    floor: null,
    phase: null,
    activity: null,
  });
  const [parsedData, setParsedData] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [projects, setProjects] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [savedEntryId, setSavedEntryId] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);

  const processTimerRef = useRef(null);
  const autoResetTimerRef = useRef(null);

  // --- Speech Recognition Hook ---
  const {
    interimTranscript,
    accumulatedTranscript,
    isProcessing: speechProcessing,
    isEngineReady,
    error: speechError,
    soundLevel,
    sessionElapsed,
    hasSpeechRecognition,
    startRecording,
    stopRecording,
    resetTranscript,
    resetAll: resetSpeech,
    setProcessing: setSpeechProcessing,
  } = useSpeechRecognition();

  // --- Fetch projects & recent entries ---
  useEffect(() => {
    projectAPI.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.projects || data.data || []);
        setProjects(list);
      })
      .catch(() => {});

    transactionAPI.getAll()
      .then(({ data }) => {
        const all = data.transactions || [];
        setRecentEntries(all.slice(0, 5));
      })
      .catch(() => setRecentEntries([]))
      .finally(() => setRecentLoading(false));
  }, []);

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      if (processTimerRef.current) clearInterval(processTimerRef.current);
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    };
  }, []);

  // --- Processing stage animation ---
  useEffect(() => {
    if (status === STATUS.processing) {
      setProcessingStage(0);
      processTimerRef.current = setInterval(() => {
        setProcessingStage(prev => {
          if (prev >= 6) { clearInterval(processTimerRef.current); return prev; }
          return prev + 1;
        });
      }, 500);
    } else {
      if (processTimerRef.current) clearInterval(processTimerRef.current);
    }
    return () => { if (processTimerRef.current) clearInterval(processTimerRef.current); };
  }, [status]);

  // --- Execution context complete → go to idle/voice ---
  const handleContextComplete = useCallback((ctx) => {
    setExecutionContext(ctx);
    setStatus(STATUS.idle);
  }, []);

  // --- Start listening ---
  const handleStartListening = useCallback(() => {
    resetTranscript();
    startRecording();
    setStatus(STATUS.listening);
  }, [startRecording, resetTranscript]);

  // --- Stop listening → process ---
  const handleStopListening = useCallback(() => {
    stopRecording();
    // Give a moment for final transcript to arrive
    setTimeout(() => {
      const fullText = accumulatedTranscript || transcript;
      if (fullText.trim()) {
        processTranscript(fullText.trim());
      } else {
        setStatus(STATUS.idle);
      }
    }, 300);
  }, [stopRecording, accumulatedTranscript, transcript]);

  // --- Process transcript via AI + local parser ---
  const processTranscript = useCallback(async (text) => {
    setStatus(STATUS.processing);
    setSpeechProcessing(true);
    setTranscript(text);

    // Local parse first (instant)
    let parsed = parseTranscript(text, {
      projectName: executionContext.project?.projectName || executionContext.project?.name,
    });

    // Apply execution context overrides
    if (executionContext.floor) parsed.floor = parsed.floor || executionContext.floor;
    if (executionContext.phase) parsed.phase = parsed.phase || executionContext.phase;
    if (executionContext.activity) parsed.activity = parsed.activity || executionContext.activity;
    if (executionContext.project) {
      parsed.projectId = executionContext.project._id;
      parsed.projectName = parsed.projectName || executionContext.project.projectName || executionContext.project.name;
    }

    // Try backend AI parse (Gemini) for enhanced extraction
    try {
      const { data } = await voiceAPI.parse({
        transcript: text,
        workers: [],
        projects: projects.map(p => p.projectName || p.name),
        entryType: parsed.entryType,
      });
      if (data && data.fields) {
        // Merge AI fields (AI takes precedence for detected fields)
        Object.entries(data.fields).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            parsed[k] = v;
          }
        });
      }
    } catch {
      // Fallback to local parser — already done above
    }

    // Auto-detect entry type from speech if not clearly material
    // (parser already does this, but allow user override later)

    parsed.amount = computeAmount(parsed);
    setParsedData(parsed);
    setEntryType(parsed.entryType);
    setSpeechProcessing(false);
    setStatus(STATUS.extracting);

    // Brief pause then go to summary
    setTimeout(() => {
      setStatus(STATUS.summary);
      setShowReview(true);
    }, 800);
  }, [executionContext, projects, setSpeechProcessing]);

  // --- Review sheet save ---
  const handleReviewSave = useCallback(async (reviewData) => {
    setShowReview(false);
    setStatus(STATUS.saving);
    setSaveError('');

    try {
      const typeMap = { material: 'Materials', labour: 'Wages', equipment: 'Expense' };
      const amount = Number(reviewData.amount) || 0;

      const payload = {
        title: `${typeMap[reviewData.entryType] || 'Expense'} - ${reviewData.itemName || reviewData.labourType || reviewData.equipmentName || 'Voice Entry'}`,
        amount,
        type: typeMap[reviewData.entryType] || 'Expense',
        date: new Date().toISOString(),
        notes: reviewData.notes || transcript || 'Entered via Voice Assistant',
        // Project & context
        project: reviewData.project || executionContext.project?._id || undefined,
        projectName: reviewData.projectName || executionContext.project?.projectName || undefined,
        floor: reviewData.floor || executionContext.floor || undefined,
        phase: reviewData.phase || executionContext.phase || undefined,
        activity: reviewData.activity || executionContext.activity || undefined,
        // Entry-type specific
        entryType: reviewData.entryType,
        itemName: reviewData.itemName || undefined,
        labourType: reviewData.labourType || undefined,
        equipmentName: reviewData.equipmentName || reviewData.itemName || undefined,
        quantity: reviewData.quantity ? Number(reviewData.quantity) : undefined,
        unit: reviewData.unit || undefined,
        rate: reviewData.rate ? Number(reviewData.rate) : undefined,
        workerCount: reviewData.workerCount ? Number(reviewData.workerCount) : undefined,
        hoursWorked: reviewData.hoursWorked ? Number(reviewData.hoursWorked) : undefined,
        dailyWage: reviewData.dailyWage ? Number(reviewData.dailyWage) : undefined,
        advanceAmount: reviewData.advanceAmount ? Number(reviewData.advanceAmount) : undefined,
        hoursUsed: reviewData.hoursUsed ? Number(reviewData.hoursUsed) : undefined,
        operatorName: reviewData.operatorName || undefined,
        fuelCost: reviewData.fuelCost ? Number(reviewData.fuelCost) : undefined,
        // Optional
        brand: reviewData.brand || undefined,
        supplier: reviewData.supplier || undefined,
        gstApplicable: reviewData.gstApplicable || false,
        gstPercentage: reviewData.gstPercentage ? Number(reviewData.gstPercentage) : undefined,
        paymentMode: reviewData.paymentMode || 'cash',
        rawTranscript: transcript,
      };

      // Remove undefined values
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      const { data } = await transactionAPI.create(payload);
      setSavedEntryId(data?.transaction?._id || data?._id || null);
      setStatus(STATUS.completed);
      fetchRecentEntries();
      autoResetTimerRef.current = setTimeout(() => {
        resetAll();
      }, 2000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save entry');
      setStatus(STATUS.summary);
      setShowReview(true);
    }
  }, [transcript, executionContext]);

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

  // --- Reset for new entry ---
  const resetAll = useCallback(() => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    resetSpeech();
    setParsedData(null);
    setTranscript('');
    setSaveError('');
    setSavedEntryId(null);
    setShowReview(false);
    setProcessingStage(0);
    setStatus(STATUS.idle);
  }, [resetSpeech]);

  // --- Navigate to transaction log ---
  const viewEntries = useCallback(() => {
    navigate('/transaction');
  }, [navigate]);

  // --- Derived state ---
  const isListening = status === STATUS.listening;
  const isIdle = status === STATUS.idle;
  const isProcessing = status === STATUS.processing;
  const isExtracting = status === STATUS.extracting;
  const isSummary = status === STATUS.summary;
  const isSaving = status === STATUS.saving;
  const isCompleted = status === STATUS.completed;
  const isError = status === STATUS.error;
  const isContext = status === STATUS.context;

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <div style={{
      display: 'flex', width: '100%', height: '100vh',
      fontFamily: typography.fontFamily, background: colors.bgBase4,
      overflow: 'hidden', flex: 1, minWidth: 0,
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes barWave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(108,99,255,0.3); }
          50% { box-shadow: 0 0 24px rgba(91,85,232,0.5); }
        }
        .voice-card { animation: slideUp 0.35s ease; }
        .fade-in { animation: fadeIn 0.3s ease; }
        .wave-bar {
          animation: barWave 1s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>

      {/* Top Bar */}
      <div style={{
        background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`,
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        gap: 12, flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ background: colors.bgBase4, border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: colors.textPrimary }}>
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
            {isContext ? 'Set Entry Context' : isCompleted ? 'Success' : 'BuildTrack AI'}
          </div>
          <div style={{ fontSize: 11, color: colors.textLight, fontWeight: 500 }}>
            {isContext
              ? 'Project, floor, phase & activity'
              : isListening
              ? `Listening... ${formatTime(sessionElapsed)}`
              : isProcessing
              ? 'Analyzing voice input...'
              : isCompleted
              ? 'Entry saved successfully'
              : 'AI Voice Entry'}
          </div>
        </div>
        {isListening && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            background: '#FEE2E2', border: '1px solid #FCA5A5',
            fontSize: 11, fontWeight: 600, color: '#DC2626',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'orbPulse 1.5s ease-in-out infinite' }} />
            REC {formatTime(sessionElapsed)}
          </div>
        )}
      </div>

      {/* Main scrollable body */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 20, paddingBottom: (isIdle || isListening) ? 160 : 40,
      }}>

        {/* ===== CONTEXT STEP ===== */}
        {isContext && (
          <ExecutionContextStep
            projects={projects}
            onComplete={handleContextComplete}
            onCancel={() => navigate(-1)}
          />
        )}

        {/* ===== IDLE / LISTENING ===== */}
        {(isIdle || isListening) && (
          <>
            {/* Entry type tabs */}
            <div className="voice-card" style={{
              background: colors.cardBg, borderRadius: radius.lg,
              border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
              padding: '16px 20px', maxWidth: 400, width: '100%',
              display: 'flex', gap: 8,
            }}>
              {ENTRY_TYPES.map(t => (
                <button key={t.id} onClick={() => !isListening && setEntryType(t.id)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: radius.sm, border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: isListening ? 'not-allowed' : 'pointer',
                    textTransform: 'capitalize', opacity: isListening ? 0.6 : 1,
                    background: entryType === t.id
                      ? 'linear-gradient(135deg, #6C63FF, #B137FF)'
                      : colors.bgBase4,
                    color: entryType === t.id ? '#FFF' : colors.textSecondary,
                    transition: 'all 0.2s',
                  }}>
                  {createElement(typeIcons[t.icon] || Package, { size: 16 })} {t.label}
                </button>
              ))}
            </div>

            {/* Execution context badge */}
            {(executionContext.project || executionContext.floor || executionContext.activity) && (
              <div className="voice-card" style={{
                background: colors.primarySurface, borderRadius: radius.lg,
                border: `1px solid ${colors.cardBorder}`,
                padding: '12px 18px', maxWidth: 600, width: '100%',
                display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
              }}>
                {executionContext.project && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.primaryBlue, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={14} /> {executionContext.project.projectName || executionContext.project.name}
                    </span>
                )}
                {executionContext.floor && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, background: colors.bgBase4, padding: '3px 8px', borderRadius: 8 }}>
                    <MapPin size={12} /> {executionContext.floor}
                  </span>
                )}
                {executionContext.phase && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, background: colors.bgBase4, padding: '3px 8px', borderRadius: 8 }}>
                    <ClipboardList size={12} /> {executionContext.phase}
                  </span>
                )}
                {executionContext.activity && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, background: colors.bgBase4, padding: '3px 8px', borderRadius: 8 }}>
                    <Hammer size={12} /> {executionContext.activity}
                  </span>
                )}
                <span
                  onClick={() => !isListening && setStatus(STATUS.context)}
                  style={{ fontSize: 11, fontWeight: 600, color: colors.primaryBlue, cursor: 'pointer', marginLeft: 'auto' }}>
                  Edit
                </span>
              </div>
            )}

            {/* Waveform + Mic / Live Transcript */}
            <div className="voice-card" style={{
              background: colors.cardBg, borderRadius: radius.lg,
              border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
              padding: '24px', textAlign: 'center', maxWidth: 600, width: '100%',
            }}>
              {isListening ? (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: colors.primaryBlue, letterSpacing: '0.1em', marginBottom: 12 }}>
                    LIVE TRANSCRIPT
                  </div>
                  {/* Waveform bars */}
                  <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div key={i} className="wave-bar"
                        style={{
                          width: 3, borderRadius: 2,
                          height: `${Math.max(4, soundLevel * 32)}px`,
                          background: `linear-gradient(to top, #6C63FF, #B137FF)`,
                          animationDelay: `${i * 0.06}s`,
                          animationDuration: `${0.6 + Math.random() * 0.4}s`,
                        }} />
                    ))}
                  </div>
                  {/* Transcript display */}
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.primaryBlue}15, #B137FF15)`,
                    borderRadius: radius.md, border: `1px solid ${colors.cardBorder}`,
                    padding: '14px 18px', fontSize: 14, color: colors.textPrimary, fontWeight: 500,
                    lineHeight: 1.5, minHeight: 48,
                  }}>
                    {interimTranscript || accumulatedTranscript || 'Listening...'}
                  </div>
                  {/* Sound level bar */}
                  <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: colors.bgBase4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, width: `${soundLevel * 100}%`,
                      background: `linear-gradient(90deg, #6C63FF, #B137FF)`,
                      transition: 'width 0.1s ease',
                    }} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: colors.textLight }}>
                    {formatTime(sessionElapsed)} &middot; Tap mic to stop
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px 0' }}>
                  {/* Idle mic */}
                  <div
                    onClick={handleStartListening}
                    style={{
                      width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                      background: 'linear-gradient(135deg, #6C63FF, #B137FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 8px 24px rgba(108,99,255,0.4)',
                      transition: 'transform 0.2s',
                    }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, marginBottom: 8 }}>
                    Tap to Start Listening
                  </div>
                  {!hasSpeechRecognition && (
                    <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>
                      Speech recognition not supported. Please use Chrome or Edge.
                    </div>
                  )}
                  {speechError && (
                    <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>
                      {speechError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Example hint (idle only) */}
            {isIdle && (
              <div className="voice-card" style={{
                background: colors.primarySurface, borderRadius: radius.lg,
                border: `1px solid ${colors.cardBorder}`,
                padding: '16px 20px', maxWidth: 600, width: '100%',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M9 18h6" /><path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.primaryBlue, marginBottom: 4 }}>Example Phrase:</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' }}>
                    {ENTRY_EXAMPLES[entryType]}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== PROCESSING ===== */}
        {isProcessing && (
          <div className="voice-card" style={{
            background: colors.cardBg, borderRadius: radius.lg,
            border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
            padding: '24px', maxWidth: 520, width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: colors.primarySurface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>BuildTrack AI</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: colors.primarySurface, color: colors.primaryBlue,
                    textTransform: 'uppercase',
                  }}>{entryType}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.primaryBlue }}>Processing...</div>
              </div>
            </div>
            <div style={{ borderRadius: radius.md, background: colors.bgBase4, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 12 }}>
                Extracting details...
              </div>
              {['Entry Type', 'Item / Labour / Equipment', 'Quantity & Rate', 'Floor & Phase', 'Amount', 'Brand / Details'].map((label, i) => {
                const icon = processingStage > i + 1 ? 'completed' : processingStage === i + 1 ? 'current' : 'pending';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, opacity: icon === 'pending' ? 0.4 : 1 }}>
                    <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icon === 'completed' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.success} stroke="white" strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="8 12 11 15 16 9" fill="none" stroke="white" strokeWidth="2" />
                        </svg>
                      ) : icon === 'current' ? (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${colors.primaryBlue}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                      ) : (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${colors.textLight}` }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: icon === 'current' ? 700 : 500, color: colors.textPrimary }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== EXTRACTING (brief preview before review sheet) ===== */}
        {isExtracting && parsedData && (
          <div className="voice-card fade-in" style={{
            background: colors.cardBg, borderRadius: radius.lg,
            border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
            padding: '24px', maxWidth: 520, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, marginBottom: 12 }}>
              AI Understanding Entry
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {[
                { label: 'Type', value: parsedData.entryType, active: true },
                { label: 'Item', value: parsedData.items?.[0] || parsedData.labourType || parsedData.equipmentName, active: !!parsedData.items?.[0] },
                { label: 'Qty', value: parsedData.quantity, active: !!parsedData.quantity },
                { label: 'Rate', value: parsedData.unitPrice ? `₹${parsedData.unitPrice}` : null, active: !!parsedData.unitPrice },
                { label: 'Amount', value: parsedData.amount ? `₹${parsedData.amount.toLocaleString('en-IN')}` : null, active: !!parsedData.amount },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{
                  padding: '6px 12px', borderRadius: 10,
                  background: '#DCFCE7', border: '1px solid #BBF7D0',
                  fontSize: 11.5, fontWeight: 600, color: '#16A34A',
                }}>
                  {f.label}: {String(f.value)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SAVING ===== */}
        {isSaving && (
          <div className="voice-card fade-in" style={{
            background: colors.cardBg, borderRadius: radius.lg,
            border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
            padding: '32px', maxWidth: 400, width: '100%', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
              border: `3px solid ${colors.primarySurface}`,
              borderTopColor: colors.primaryBlue,
              animation: 'spin 0.7s linear infinite',
            }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
              Saving Entry...
            </div>
            <div style={{ fontSize: 12, color: colors.textLight }}>
              Please wait
            </div>
          </div>
        )}

        {/* ===== COMPLETED ===== */}
        {isCompleted && (
          <div className="voice-card fade-in" style={{
            background: colors.cardBg, borderRadius: radius.lg,
            border: `1px solid ${colors.cardBorder}`, boxShadow: shadows.card,
            padding: '32px 28px', textAlign: 'center', maxWidth: 500, width: '100%',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #22C55E, #10B981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary, marginBottom: 6 }}>
              Entry Saved Successfully!
            </div>
            <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 20 }}>
              Your {entryType} entry has been recorded.
            </div>
            {parsedData && (
              <div style={{
                background: '#F0FDF4', borderRadius: radius.lg,
                border: '1px solid #BBF7D0', padding: '16px 20px', marginBottom: 24, textAlign: 'left',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: colors.textLight }}>Type</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary, textTransform: 'capitalize' }}>{entryType}</span>
                </div>
                <div style={{ height: 1, background: '#DCFCE7', marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: colors.textLight }}>Item</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary }}>
                    {parsedData.items?.[0] || parsedData.labourType || parsedData.equipmentName || '-'}
                  </span>
                </div>
                <div style={{ height: 1, background: '#DCFCE7', marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: colors.textLight }}>Amount</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary }}>₹{parsedData.amount?.toLocaleString('en-IN') || '0'}</span>
                </div>
                {savedEntryId && (
                  <>
                    <div style={{ height: 1, background: '#DCFCE7', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: colors.textLight }}>Entry ID</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: colors.textPrimary, fontFamily: 'monospace' }}>{savedEntryId}</span>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={resetAll}
              style={{
                width: '100%', padding: '15px 0', borderRadius: radius.md, border: 'none',
                background: 'linear-gradient(135deg, #6C63FF, #B137FF)',
                color: '#FFF', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10,
              }}>
              Add Another Entry
            </button>
            <button onClick={viewEntries}
              style={{
                width: '100%', padding: '14px 0', borderRadius: radius.md,
                border: `1.5px solid ${colors.primaryBlue}`, background: 'transparent',
                color: colors.primaryBlue, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
              View All Entries
            </button>
          </div>
        )}

        {/* ===== ERROR ===== */}
        {(isError || saveError) && (
          <div className="voice-card fade-in" style={{
            background: colors.cardBg, borderRadius: radius.lg,
            border: '1px solid #FCA5A5', boxShadow: shadows.card,
            padding: '20px', maxWidth: 500, width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>Error</span>
            </div>
            <div style={{ fontSize: 13, color: '#991B1B', marginBottom: 16 }}>
              {saveError || speechError || 'Something went wrong. Please try again.'}
            </div>
            <button onClick={() => { setSaveError(''); resetAll(); }}
              style={{
                width: '100%', padding: '12px', borderRadius: radius.md, border: 'none',
                background: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
              Try Again
            </button>
          </div>
        )}

        {/* ===== RECENT ENTRIES (when idle) ===== */}
        {(isIdle || isContext) && (
          <div style={{ width: '100%', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Recent Entries</h3>
              <span onClick={viewEntries}
                style={{ fontSize: 12, color: colors.primaryBlue, fontWeight: 600, cursor: 'pointer' }}>
                View History
              </span>
            </div>
            <div style={{
              background: colors.cardBg, borderRadius: radius.lg,
              border: `1px solid ${colors.cardBorder}`, overflow: 'hidden',
            }}>
              {recentLoading ? (
                <div style={{ padding: 30, textAlign: 'center', color: colors.textLight, fontSize: 13 }}>Loading...</div>
              ) : recentEntries.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: colors.textLight, fontSize: 13 }}>No entries yet</div>
              ) : recentEntries.map((t, i) => {
                const typeLabel = t.type || 'Expense';
                const typeColor = typeLabel === 'Materials' ? colors.primaryBlue : typeLabel === 'Wages' ? '#D97706' : typeLabel === 'Income' ? colors.success : colors.textSecondary;
                const typeBg = typeLabel === 'Materials' ? colors.primarySurface : typeLabel === 'Wages' ? '#FFFBEB' : typeLabel === 'Income' ? '#F0FDF4' : colors.bgBase4;
                return (
                  <div key={t._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', borderBottom: i < recentEntries.length - 1 ? `1px solid ${colors.bgBase4}` : 'none',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, marginBottom: 2 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: colors.textLight }}>{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: typeBg, color: typeColor,
                    }}>{typeLabel.toUpperCase()}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: typeLabel === 'Income' ? colors.success : colors.textPrimary, marginLeft: 16, minWidth: 70, textAlign: 'right' }}>
                      {typeLabel === 'Income' ? '+' : '-'}₹{(t.amount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM FLOATING MIC BUTTON (when idle/listening) ===== */}
      {(isIdle || isListening) && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(255,255,255,0.98) 60%, rgba(255,255,255,0))',
          padding: '24px 24px 20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', justifyContent: 'center', zIndex: 20,
        }}>
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            style={{
              width: isListening ? 64 : 72,
              height: isListening ? 64 : 72,
              borderRadius: '50%', border: 'none',
              background: isListening
                ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                : 'linear-gradient(135deg, #6C63FF, #B137FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening
                ? '0 4px 20px rgba(239,68,68,0.4)'
                : '0 8px 30px rgba(108,99,255,0.4)',
              transition: 'all 0.2s ease',
            }}>
            {isListening ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* ===== VOICE REVIEW SHEET (bottom sheet) ===== */}
      <VoiceReviewSheet
        key={showReview ? `review-${Date.now()}` : 'review-closed'}
        isOpen={showReview}
        onClose={() => { setShowReview(false); setStatus(STATUS.summary); }}
        initialData={parsedData || {}}
        projects={projects}
        executionContext={executionContext}
        onSave={handleReviewSave}
      />
    </div>
  );
}
