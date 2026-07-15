import { useState, useCallback, useRef } from "react";
import { PAYMENT_MODES, GST_PERCENTAGES, ACTIVITY_OPTIONS, PHASE_OPTIONS } from "../utils/voiceConstants";

// ---------------------------------------------------------------------------
// VoiceReviewSheet — Flutter voice_confirmation_sheet.dart parity
//
// Features:
//   • Per-step voice input (mic button to speak any field value)
//   • Dynamic steps based on entry type
//   • Labour-specific: workerCount, hoursWorked, dailyWage, advanceAmount
//   • Equipment-specific: operatorName, hoursUsed, fuelCost
//   • GST percentage selection (not text input)
//   • "Credit" payment mode
//   • Amount auto-computation
//   • Edit form in summary
// ---------------------------------------------------------------------------

const ENTRY_TYPES = [
  { id: 'material', label: 'Material', icon: '🧱', desc: 'Cement, sand, steel, bricks...' },
  { id: 'labour', label: 'Labour', icon: '👷', desc: 'Workers, masons, helpers...' },
  { id: 'equipment', label: 'Equipment', icon: '🚜', desc: 'JCB, crane, mixer...' },
];

const UNITS = ['Bags', 'Kg', 'Tons', 'CFT', 'Sqft', 'Rft', 'Nos', 'Ltrs', 'Cum', 'Days', 'Hours', 'Per Day', 'Trips', 'Load'];

const QUICK_ITEMS = {
  material: ['Cement', 'Sand', 'Steel', 'Bricks', 'Aggregate', 'Tiles', 'Paint', 'Pipes', 'Wire', 'Block'],
  labour: ['Mason', 'Helper', 'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Welder', 'Supervisor'],
  equipment: ['JCB', 'Crane', 'Mixer', 'Compactor', 'Loader', 'Excavator', 'Generator', 'Compressor', 'Roller', 'Tipper'],
};

const LABOUR_TYPES = ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Helper', 'Welder', 'Supervisor', 'Fitter', 'Bar Bender', 'Other'];

const formatINR = (n) => {
  const num = Number(n);
  if (isNaN(num)) return '0';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  return num.toLocaleString('en-IN');
};

// --- Per-step mic hook (lightweight Web Speech API) ---
function useStepVoice() {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState('');
  const recRef = useRef(null);

  const start = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setResult(text);
      setListening(false);
      onResult?.(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, result, start, stop };
}

// --- Voice Mic Button component ---
function StepMicButton({ onTranscript }) {
  const { listening, start, stop } = useStepVoice();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        listening ? stop() : start(onTranscript);
      }}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: listening ? '#FEE2E2' : '#ECEBFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
      }}
      title="Speak this value"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={listening ? '#EF4444' : '#6C63FF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {listening ? (
          <>
            <rect x="6" y="6" width="12" height="12" rx="2" fill={listening ? '#FCA5A5' : 'none'} />
          </>
        ) : (
          <>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </>
        )}
      </svg>
    </button>
  );
}

function buildInitialData(d = {}) {
  return {
    entryType: d.entryType || '',
    project: d.projectId || d.project || '',
    projectName: d.projectName || '',
    floor: d.floor || '',
    phase: d.phase || '',
    activity: d.activity || '',
    itemName: d.items?.[0] || d.itemName || '',
    quantity: d.quantity || '',
    unit: d.unit || '',
    rate: d.unitPrice || d.rate || '',
    brand: d.brand || '',
    supplier: d.supplier || '',
    gstApplicable: d.gstApplicable || false,
    gstPercentage: d.gstPercentage || '',
    paymentMode: d.paymentMode || 'cash',
    notes: d.notes || '',
    // Labour-specific
    labourType: d.labourType || d.items?.[0] || '',
    workerCount: d.workerCount || '',
    hoursWorked: d.hoursWorked || '',
    dailyWage: d.dailyWage || '',
    advanceAmount: d.advanceAmount || '',
    // Equipment-specific
    equipmentName: d.equipmentName || d.items?.[0] || '',
    hoursUsed: d.hoursUsed || '',
    operatorName: d.operatorName || '',
    fuelCost: d.fuelCost || '',
  };
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#5a6b82',
  letterSpacing: '0.08em', marginBottom: 6,
};

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1px solid #e5e7eb', background: '#fff',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
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
  const [customInput, setCustomInput] = useState('');

  // Data is initialized on mount; parent should use a key prop to reset

  // --- Build steps dynamically based on entry type ---
  const steps = buildSteps(data.entryType);
  const step = steps[currentStep];

  // --- Computation ---
  const computedAmount = computeAmount(data);
  const gstAmount = data.gstApplicable && data.gstPercentage
    ? computedAmount * (Number(data.gstPercentage) / 100)
    : 0;
  const totalAmount = computedAmount + gstAmount;

  const updateField = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const stepsLength = steps.length;
  const goNext = useCallback(() => {
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, stepsLength - 1));
    }, 150);
  }, [stepsLength]);

  const handleSave = () => {
    onSave?.({
      ...data,
      amount: totalAmount,
      computedAmount,
      gstAmount,
    });
  };

  if (!isOpen || !step) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: '100%', maxWidth: 560, maxHeight: '92vh',
        background: '#f4f6fc', borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d1d5db' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              🎤
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1724' }}>BuildTrack AI</div>
              <div style={{ fontSize: 11, color: '#5a6b82' }}>Step {currentStep + 1} of {steps.length} &middot; {step.label}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: '#f3f4f6', fontSize: 16, cursor: 'pointer', color: '#666',
          }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: 2,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Answered chips */}
        {currentStep > 0 && (
          <div style={{
            display: 'flex', gap: 6, padding: '0 20px 10px',
            overflowX: 'auto', flexShrink: 0,
          }}>
            {steps.slice(0, currentStep).map(s => {
              const val = getStepValue(s.id, data);
              if (!val) return null;
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 20,
                  border: '1px solid #c7d2fe', background: '#eef2ff',
                  fontSize: 11, fontWeight: 600, color: '#4338ca',
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                }} onClick={() => setCurrentStep(steps.indexOf(s))}>
                  <span>{s.icon}</span>
                  <span>{val}</span>
                  <span style={{ color: '#10b981', marginLeft: 2 }}>✓</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {renderStep({
            step, data, updateField, goNext, customInput, setCustomInput,
            projects, computedAmount, totalAmount, gstAmount,
             setCurrentStep, handleSave,
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step builders
// ---------------------------------------------------------------------------

function buildSteps(entryType) {
  const base = [
    { id: 'entryType', label: 'Entry Type', icon: '📦', required: true },
    { id: 'project', label: 'Project', icon: '🏗️', required: true },
  ];

  if (entryType === 'labour') {
    return [
      ...base,
      { id: 'labourType', label: 'Labour Type', icon: '👷', required: true },
      { id: 'workerCount', label: 'Worker Count', icon: '👥', required: true },
      { id: 'hoursWorked', label: 'Hours Worked', icon: '⏰', required: true },
      { id: 'dailyWage', label: 'Daily Wage (₹)', icon: '💰', required: true },
      { id: 'floor', label: 'Floor', icon: '🏢', required: false },
      { id: 'phase', label: 'Phase', icon: '📋', required: false },
      { id: 'activity', label: 'Activity', icon: '🔨', required: false },
      { id: 'optionals', label: 'Details', icon: '📝', required: false },
      { id: 'review', label: 'Review', icon: '✅', required: true },
    ];
  }

  if (entryType === 'equipment') {
    return [
      ...base,
      { id: 'equipmentName', label: 'Equipment', icon: '🚜', required: true },
      { id: 'hoursUsed', label: 'Hours Used', icon: '⏰', required: true },
      { id: 'rate', label: 'Rate (₹/hr)', icon: '💰', required: true },
      { id: 'floor', label: 'Floor', icon: '🏢', required: false },
      { id: 'phase', label: 'Phase', icon: '📋', required: false },
      { id: 'activity', label: 'Activity', icon: '🔨', required: false },
      { id: 'optionals', label: 'Details', icon: '📝', required: false },
      { id: 'review', label: 'Review', icon: '✅', required: true },
    ];
  }

  // material (default)
  return [
    ...base,
    { id: 'itemName', label: 'Item Name', icon: '🏷️', required: true },
    { id: 'quantity', label: 'Quantity', icon: '#️⃣', required: true },
    { id: 'unit', label: 'Unit', icon: '📐', required: true },
    { id: 'rate', label: 'Rate (₹)', icon: '💰', required: true },
    { id: 'floor', label: 'Floor', icon: '🏢', required: false },
    { id: 'phase', label: 'Phase', icon: '📋', required: false },
    { id: 'activity', label: 'Activity', icon: '🔨', required: false },
    { id: 'optionals', label: 'Details', icon: '📝', required: false },
    { id: 'review', label: 'Review', icon: '✅', required: true },
  ];
}

function getStepValue(stepId, data) {
  switch (stepId) {
    case 'project': return data.projectName || data.project;
    case 'labourType': return data.labourType;
    case 'workerCount': return data.workerCount ? `${data.workerCount} workers` : '';
    case 'hoursWorked': return data.hoursWorked ? `${data.hoursWorked} hrs` : '';
    case 'dailyWage': return data.dailyWage ? `₹${formatINR(data.dailyWage)}` : '';
    case 'equipmentName': return data.equipmentName;
    case 'hoursUsed': return data.hoursUsed ? `${data.hoursUsed} hrs` : '';
    case 'itemName': return data.itemName;
    case 'quantity': return data.quantity ? `${data.quantity} ${data.unit}` : '';
    case 'unit': return data.unit;
    case 'rate': return data.rate ? `₹${formatINR(data.rate)}` : '';
    case 'floor': return data.floor;
    case 'phase': return data.phase;
    case 'activity': return data.activity;
    default: return '';
  }
}

function computeAmount(data) {
  if (data.entryType === 'labour') {
    const workers = Number(data.workerCount) || 0;
    const hours = Number(data.hoursWorked) || 0;
    const wage = Number(data.dailyWage) || 0;
    if (workers && hours && wage) return workers * hours * wage;
    if (workers && wage) return workers * wage;
    return 0;
  }
  if (data.entryType === 'equipment') {
    const hours = Number(data.hoursUsed) || 0;
    const rate = Number(data.rate) || 0;
    return hours * rate;
  }
  // material
  const qty = Number(data.quantity) || 0;
  const rate = Number(data.rate) || 0;
  return qty * rate;
}

// ---------------------------------------------------------------------------
// Step renderer
// ---------------------------------------------------------------------------

function renderStep({ step, data, updateField, goNext, customInput, setCustomInput, projects, computedAmount, totalAmount, gstAmount, setCurrentStep, handleSave }) {
  switch (step.id) {
    case 'entryType':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>What type of entry?</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 20 }}>Select the category that best describes this entry</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {ENTRY_TYPES.map(t => (
              <div key={t.id} onClick={() => { updateField('entryType', t.id); setTimeout(goNext, 200); }}
                style={{
                  padding: '20px 12px', borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${data.entryType === t.id ? '#6366f1' : '#e5e7eb'}`,
                  background: data.entryType === t.id ? '#eef2ff' : '#fff',
                  textAlign: 'center', transition: 'all 0.2s ease',
                }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1724', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#5a6b82' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'project':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>🏗️ Select Project</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>Which project is this entry for?</div>
          {projects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {projects.map(p => (
                <div key={p._id} onClick={() => { updateField('project', p._id); updateField('projectName', p.projectName || p.name); setTimeout(goNext, 200); }}
                  style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${data.project === p._id ? '#6366f1' : '#e5e7eb'}`,
                    background: data.project === p._id ? '#eef2ff' : '#fff',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: data.project === p._id ? '#6366f1' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏗️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f1724' }}>{p.projectName || p.name}</div>
                    {p.location && <div style={{ fontSize: 12, color: '#5a6b82' }}>{p.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5a6b82', letterSpacing: '0.05em', marginBottom: 8 }}>OR TYPE PROJECT NAME</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) { updateField('project', customInput.trim()); updateField('projectName', customInput.trim()); goNext(); } }}
              placeholder="Type project name..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <button onClick={() => { if (customInput.trim()) { updateField('project', customInput.trim()); updateField('projectName', customInput.trim()); goNext(); } }}
              style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>→</button>
          </div>
        </div>
      );

    case 'itemName':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>🏷️ Item Name</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>What is this entry about?</div>
          {QUICK_ITEMS[data.entryType] && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {QUICK_ITEMS[data.entryType].map(item => (
                <div key={item} onClick={() => { updateField('itemName', item); setTimeout(goNext, 200); }}
                  style={{
                    padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                    border: `2px solid ${data.itemName === item ? '#6366f1' : '#e5e7eb'}`,
                    background: data.itemName === item ? '#eef2ff' : '#fff',
                    fontSize: 13, fontWeight: 600, color: data.itemName === item ? '#4338ca' : '#5a6b82',
                  }}>{item}</div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) { updateField('itemName', customInput.trim()); goNext(); } }}
              placeholder="Type item name..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { updateField('itemName', text); }} />
          </div>
        </div>
      );

    case 'labourType':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>👷 Labour Type</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>What type of worker?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {LABOUR_TYPES.map(t => (
              <div key={t} onClick={() => { updateField('labourType', t); setTimeout(goNext, 200); }}
                style={{
                  padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                  border: `2px solid ${data.labourType === t ? '#6366f1' : '#e5e7eb'}`,
                  background: data.labourType === t ? '#eef2ff' : '#fff',
                  fontSize: 13, fontWeight: 600, color: data.labourType === t ? '#4338ca' : '#5a6b82',
                }}>{t}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) { updateField('labourType', customInput.trim()); goNext(); } }}
              placeholder="Or type labour type..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { updateField('labourType', text); }} />
          </div>
        </div>
      );

    case 'workerCount':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>👥 Worker Count</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>How many workers?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <input type="number" value={data.workerCount} onChange={e => updateField('workerCount', e.target.value)}
              placeholder="0" autoFocus
              style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f1724', outline: 'none', textAlign: 'center' }} />
            <StepMicButton onTranscript={(text) => { const n = text.match(/\d+/); if (n) updateField('workerCount', n[0]); }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[1, 2, 3, 5, 8, 10, 15, 20].map(n => (
              <div key={n} onClick={() => updateField('workerCount', String(n))}
                style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a6b82' }}>{n}</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.workerCount}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: data.workerCount ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb', color: data.workerCount ? '#fff' : '#999', fontWeight: 700, fontSize: 15, cursor: data.workerCount ? 'pointer' : 'not-allowed' }}>Next →</button>
        </div>
      );

    case 'hoursWorked':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>⏰ Hours Worked</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>How many hours?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <input type="number" value={data.hoursWorked} onChange={e => updateField('hoursWorked', e.target.value)}
              placeholder="0" autoFocus
              style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f1724', outline: 'none', textAlign: 'center' }} />
            <StepMicButton onTranscript={(text) => { const n = text.match(/\d+(\.\d+)?/); if (n) updateField('hoursWorked', n[0]); }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[4, 6, 8, 9, 10, 12].map(n => (
              <div key={n} onClick={() => updateField('hoursWorked', String(n))}
                style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a6b82' }}>{n}h</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.hoursWorked}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: data.hoursWorked ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb', color: data.hoursWorked ? '#fff' : '#999', fontWeight: 700, fontSize: 15, cursor: data.hoursWorked ? 'pointer' : 'not-allowed' }}>Next →</button>
        </div>
      );

    case 'dailyWage':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>💰 Daily Wage (₹)</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>Rate per worker per day?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f1724' }}>₹</span>
            <input type="number" value={data.dailyWage} onChange={e => updateField('dailyWage', e.target.value)}
              placeholder="0" autoFocus
              style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f1724', outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { const n = text.match(/\d[\d,]*/); if (n) updateField('dailyWage', n[0].replace(/,/g, '')); }} />
          </div>
          {data.workerCount && data.hoursWorked && data.dailyWage && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#eef2ff', border: '1px solid #c7d2fe', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#5a6b82' }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#4338ca' }}>₹{formatINR(data.workerCount * data.hoursWorked * data.dailyWage)}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[500, 600, 800, 1000, 1200, 1500].map(n => (
              <div key={n} onClick={() => updateField('dailyWage', String(n))}
                style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a6b82' }}>₹{n}</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.dailyWage}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: data.dailyWage ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb', color: data.dailyWage ? '#fff' : '#999', fontWeight: 700, fontSize: 15, cursor: data.dailyWage ? 'pointer' : 'not-allowed' }}>Next →</button>
        </div>
      );

    case 'equipmentName':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>🚜 Equipment</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>Which equipment?</div>
          {QUICK_ITEMS.equipment && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {QUICK_ITEMS.equipment.map(item => (
                <div key={item} onClick={() => { updateField('equipmentName', item); setTimeout(goNext, 200); }}
                  style={{
                    padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                    border: `2px solid ${data.equipmentName === item ? '#6366f1' : '#e5e7eb'}`,
                    background: data.equipmentName === item ? '#eef2ff' : '#fff',
                    fontSize: 13, fontWeight: 600, color: data.equipmentName === item ? '#4338ca' : '#5a6b82',
                  }}>{item}</div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) { updateField('equipmentName', customInput.trim()); goNext(); } }}
              placeholder="Type equipment name..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { updateField('equipmentName', text); }} />
          </div>
        </div>
      );

    case 'hoursUsed':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>⏰ Hours Used</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>How many hours?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <input type="number" value={data.hoursUsed} onChange={e => updateField('hoursUsed', e.target.value)}
              placeholder="0" autoFocus
              style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f1724', outline: 'none', textAlign: 'center' }} />
            <StepMicButton onTranscript={(text) => { const n = text.match(/\d+(\.\d+)?/); if (n) updateField('hoursUsed', n[0]); }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[2, 4, 6, 8, 10, 12].map(n => (
              <div key={n} onClick={() => updateField('hoursUsed', String(n))}
                style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a6b82' }}>{n}h</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.hoursUsed}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: data.hoursUsed ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb', color: data.hoursUsed ? '#fff' : '#999', fontWeight: 700, fontSize: 15, cursor: data.hoursUsed ? 'pointer' : 'not-allowed' }}>Next →</button>
        </div>
      );

    case 'quantity':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>#️⃣ Quantity</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>How many / how much?</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <input type="number" value={data.quantity} onChange={e => updateField('quantity', e.target.value)}
              placeholder="0" autoFocus
              style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f1724', outline: 'none', textAlign: 'center' }} />
            <StepMicButton onTranscript={(text) => { const n = text.match(/\d+(\.\d+)?/); if (n) updateField('quantity', n[0]); }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[5, 10, 20, 50, 100].map(n => (
              <div key={n} onClick={() => updateField('quantity', String(n))}
                style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a6b82' }}>{n}</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.quantity}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: data.quantity ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb', color: data.quantity ? '#fff' : '#999', fontWeight: 700, fontSize: 15, cursor: data.quantity ? 'pointer' : 'not-allowed' }}>Next →</button>
        </div>
      );

    case 'unit':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>📐 Unit</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>What unit of measurement?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {UNITS.map(u => (
              <div key={u} onClick={() => { updateField('unit', u); setTimeout(goNext, 200); }}
                style={{
                  padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                  border: `2px solid ${data.unit === u ? '#6366f1' : '#e5e7eb'}`,
                  background: data.unit === u ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#fff',
                  color: data.unit === u ? '#fff' : '#5a6b82',
                  fontSize: 13, fontWeight: 600,
                }}>{u}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) { updateField('unit', customInput.trim()); goNext(); } }}
              placeholder="Custom unit..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { updateField('unit', text); }} />
          </div>
        </div>
      );

    case 'rate':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>
            💰 {data.entryType === 'equipment' ? 'Rate (₹/hr)' : 'Rate (₹)'}
          </div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>
            {data.entryType === 'equipment' ? 'Hourly rate?' : `Cost per ${data.unit || 'unit'}?`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f1724' }}>₹</span>
            <input type="number" value={data.rate} onChange={e => updateField('rate', e.target.value)}
              placeholder="0" autoFocus
              style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f1724', outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { const n = text.match(/\d[\d,]*/); if (n) updateField('rate', n[0].replace(/,/g, '')); }} />
          </div>
          {computedAmount > 0 && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#eef2ff', border: '1px solid #c7d2fe', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#5a6b82' }}>Total Amount</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#4338ca' }}>₹{formatINR(computedAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[100, 500, 800, 1000, 1500, 2000, 5000].map(n => (
              <div key={n} onClick={() => updateField('rate', String(n))}
                style={{ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#5a6b82' }}>₹{n.toLocaleString('en-IN')}</div>
            ))}
          </div>
          <button onClick={goNext} disabled={!data.rate}
            style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: data.rate ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb', color: data.rate ? '#fff' : '#999', fontWeight: 700, fontSize: 15, cursor: data.rate ? 'pointer' : 'not-allowed' }}>Next →</button>
        </div>
      );

    case 'floor':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>🏢 Floor / Level</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>Optional — which floor or level?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Roof'].map(f => (
              <div key={f} onClick={() => { updateField('floor', f); setTimeout(goNext, 200); }}
                style={{
                  padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                  border: `2px solid ${data.floor === f ? '#6366f1' : '#e5e7eb'}`,
                  background: data.floor === f ? '#eef2ff' : '#fff',
                  fontSize: 13, fontWeight: 600, color: data.floor === f ? '#4338ca' : '#5a6b82',
                }}>{f}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { updateField('floor', customInput || 'N/A'); goNext(); } }}
              placeholder="Or type floor..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { updateField('floor', text); }} />
          </div>
          <button onClick={() => { updateField('floor', 'N/A'); goNext(); }}
            style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #6366f1', background: 'transparent', color: '#6366f1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Skip — No floor</button>
        </div>
      );

    case 'phase':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>📋 Construction Phase</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>Which phase of construction?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {PHASE_OPTIONS.map(p => (
              <div key={p} onClick={() => { updateField('phase', p); setTimeout(goNext, 200); }}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${data.phase === p ? '#6366f1' : '#e5e7eb'}`,
                  background: data.phase === p ? '#eef2ff' : '#fff',
                  fontSize: 14, fontWeight: 600, color: data.phase === p ? '#4338ca' : '#0f1724',
                }}>{p}</div>
            ))}
          </div>
          <button onClick={() => { updateField('phase', 'N/A'); goNext(); }}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #6366f1', background: 'transparent', color: '#6366f1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Skip — No phase</button>
        </div>
      );

    case 'activity':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>🔨 Activity</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 16 }}>What work is being done?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {ACTIVITY_OPTIONS.slice(0, 12).map(a => (
              <div key={a} onClick={() => { updateField('activity', a); setTimeout(goNext, 200); }}
                style={{
                  padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                  border: `2px solid ${data.activity === a ? '#6366f1' : '#e5e7eb'}`,
                  background: data.activity === a ? '#eef2ff' : '#fff',
                  fontSize: 13, fontWeight: 600, color: data.activity === a ? '#4338ca' : '#5a6b82',
                }}>{a}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={customInput} onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { updateField('activity', customInput || 'N/A'); goNext(); } }}
              placeholder="Or type activity..."
              style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, outline: 'none' }} />
            <StepMicButton onTranscript={(text) => { updateField('activity', text); }} />
          </div>
          <button onClick={() => { updateField('activity', 'N/A'); goNext(); }}
            style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #6366f1', background: 'transparent', color: '#6366f1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Skip — No activity</button>
        </div>
      );

    case 'optionals':
      return (
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f1724', marginBottom: 6 }}>📝 Additional Details</div>
          <div style={{ fontSize: 13, color: '#5a6b82', marginBottom: 20 }}>Optional — add more context</div>

          {/* Material-specific */}
          {data.entryType === 'material' && (
            <>
              <label style={labelStyle}>BRAND</label>
              <input value={data.brand} onChange={e => updateField('brand', e.target.value)}
                placeholder="e.g. UltraTech" style={{ ...inputStyle, marginBottom: 12 }} />
              <label style={labelStyle}>SUPPLIER</label>
              <input value={data.supplier} onChange={e => updateField('supplier', e.target.value)}
                placeholder="e.g. local dealer" style={{ ...inputStyle, marginBottom: 12 }} />
            </>
          )}

          {/* Labour-specific optionals */}
          {data.entryType === 'labour' && (
            <>
              <label style={labelStyle}>ADVANCE AMOUNT (₹)</label>
              <input type="number" value={data.advanceAmount} onChange={e => updateField('advanceAmount', e.target.value)}
                placeholder="0" style={{ ...inputStyle, marginBottom: 12 }} />
            </>
          )}

          {/* Equipment-specific optionals */}
          {data.entryType === 'equipment' && (
            <>
              <label style={labelStyle}>OPERATOR NAME</label>
              <input value={data.operatorName} onChange={e => updateField('operatorName', e.target.value)}
                placeholder="e.g. Ramesh" style={{ ...inputStyle, marginBottom: 12 }} />
              <label style={labelStyle}>FUEL COST (₹)</label>
              <input type="number" value={data.fuelCost} onChange={e => updateField('fuelCost', e.target.value)}
                placeholder="0" style={{ ...inputStyle, marginBottom: 12 }} />
            </>
          )}

          {/* GST */}
          <label style={labelStyle}>GST APPLICABLE?</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div onClick={() => updateField('gstApplicable', false)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${!data.gstApplicable ? '#6366f1' : '#e5e7eb'}`,
                background: !data.gstApplicable ? '#eef2ff' : '#fff',
                fontSize: 13, fontWeight: 600, color: !data.gstApplicable ? '#4338ca' : '#5a6b82',
              }}>No GST</div>
            <div onClick={() => updateField('gstApplicable', true)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${data.gstApplicable ? '#6366f1' : '#e5e7eb'}`,
                background: data.gstApplicable ? '#eef2ff' : '#fff',
                fontSize: 13, fontWeight: 600, color: data.gstApplicable ? '#4338ca' : '#5a6b82',
              }}>With GST</div>
          </div>
          {data.gstApplicable && (
            <>
              <label style={labelStyle}>GST PERCENTAGE</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {GST_PERCENTAGES.filter(g => g > 0).map(g => (
                  <div key={g} onClick={() => updateField('gstPercentage', String(g))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${data.gstPercentage === String(g) ? '#6366f1' : '#e5e7eb'}`,
                      background: data.gstPercentage === String(g) ? '#eef2ff' : '#fff',
                      fontSize: 13, fontWeight: 600, color: data.gstPercentage === String(g) ? '#4338ca' : '#5a6b82',
                    }}>{g}%</div>
                ))}
              </div>
            </>
          )}

          {/* Payment Mode */}
          <label style={{ ...labelStyle, marginTop: 12 }}>PAYMENT MODE</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {PAYMENT_MODES.map(m => (
              <div key={m} onClick={() => updateField('paymentMode', m.toLowerCase())}
                style={{
                  padding: '10px 16px', borderRadius: 20, cursor: 'pointer',
                  border: `2px solid ${data.paymentMode === m.toLowerCase() ? '#6366f1' : '#e5e7eb'}`,
                  background: data.paymentMode === m.toLowerCase() ? '#eef2ff' : '#fff',
                  fontSize: 12, fontWeight: 600, color: data.paymentMode === m.toLowerCase() ? '#4338ca' : '#5a6b82',
                }}>{m}</div>
            ))}
          </div>

          {/* Notes */}
          <label style={labelStyle}>NOTES</label>
          <textarea value={data.notes} onChange={e => updateField('notes', e.target.value)}
            placeholder="Any additional notes..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

          <button onClick={goNext}
            style={{
              marginTop: 16, width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>Review Entry →</button>
        </div>
      );

    case 'review':
      return (
        <div>
          <div style={{
            padding: '16px 20px', borderRadius: 14, marginBottom: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>TOTAL AMOUNT</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>₹{formatINR(totalAmount)}</div>
            {gstAmount > 0 && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                +{data.gstPercentage}% GST = ₹{formatINR(gstAmount)}
              </div>
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {[
              { label: 'Type', value: data.entryType?.charAt(0).toUpperCase() + data.entryType?.slice(1) },
              { label: 'Project', value: data.projectName || data.project },
              ...(data.entryType === 'labour' ? [
                { label: 'Labour Type', value: data.labourType },
                { label: 'Workers', value: data.workerCount },
                { label: 'Hours', value: data.hoursWorked },
                { label: 'Daily Wage', value: `₹${formatINR(data.dailyWage)}` },
                ...(data.advanceAmount ? [{ label: 'Advance', value: `₹${formatINR(data.advanceAmount)}` }] : []),
              ] : data.entryType === 'equipment' ? [
                { label: 'Equipment', value: data.equipmentName },
                { label: 'Hours', value: data.hoursUsed },
                { label: 'Rate', value: `₹${formatINR(data.rate)} / hr` },
                ...(data.operatorName ? [{ label: 'Operator', value: data.operatorName }] : []),
                ...(data.fuelCost ? [{ label: 'Fuel Cost', value: `₹${formatINR(data.fuelCost)}` }] : []),
              ] : [
                { label: 'Item', value: data.itemName },
                { label: 'Quantity', value: `${data.quantity} ${data.unit}` },
                { label: 'Rate', value: `₹${formatINR(data.rate)} / ${data.unit}` },
              ]),
              { label: 'Subtotal', value: `₹${formatINR(computedAmount)}` },
              ...(data.brand ? [{ label: 'Brand', value: data.brand }] : []),
              ...(data.supplier ? [{ label: 'Supplier', value: data.supplier }] : []),
              ...(data.gstApplicable ? [{ label: 'GST', value: `${data.gstPercentage}% (+₹${formatINR(gstAmount)})` }] : []),
              { label: 'Payment', value: data.paymentMode?.charAt(0).toUpperCase() + data.paymentMode?.slice(1) },
              ...(data.floor && data.floor !== 'N/A' ? [{ label: 'Floor', value: data.floor }] : []),
              ...(data.phase && data.phase !== 'N/A' ? [{ label: 'Phase', value: data.phase }] : []),
              ...(data.activity && data.activity !== 'N/A' ? [{ label: 'Activity', value: data.activity }] : []),
              ...(data.notes ? [{ label: 'Notes', value: data.notes }] : []),
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#5a6b82' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1724', textTransform: 'capitalize', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={() => setCurrentStep(0)}
              style={{
                flex: 1, padding: '14px', borderRadius: 12,
                border: '2px solid #6366f1', background: 'transparent',
                color: '#6366f1', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Edit</button>
            <button onClick={handleSave}
              style={{
                flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}>✓ Confirm &amp; Save</button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
