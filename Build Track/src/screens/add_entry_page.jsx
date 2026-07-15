import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, shadows, typography, gradients } from '../styles/designTokens';
import Card from '../components/ui/Card';
import CsvImport from '../components/CsvImport';

const CSV_COLUMNS = [
  'Date', 'Project', 'Floor', 'Phase', 'Activity', 'Type', 'Name',
  'Category / Trade', 'Subtype', 'Brand', 'Supplier / Operator',
  'Quantity', 'Unit', 'Rate', 'Overtime', 'IsWithGst', 'GstPercentage',
  'Payment Status', 'Notes'
];

const MATERIAL_TEMPLATE_HEADERS = [
  'Date', 'Project', 'Floor', 'Phase', 'Activity', 'Material / Item', 'Unit',
  'Quantity', 'Rate', 'Brand', 'Category', 'Supplier', 'IsWithGst', 'GstPercentage', 'Notes'
];

const LABOUR_TEMPLATE_HEADERS = [
  'Date', 'Project', 'Floor', 'Phase', 'Activity', 'Labour Type', 'Unit',
  'Quantity', 'Rate', 'Trade / Work Type', 'Contractor / Team', 'Overtime Amount', 'Notes'
];

const EQUIPMENT_TEMPLATE_HEADERS = [
  'Date', 'Project', 'Floor', 'Phase', 'Activity', 'Equipment Name', 'Unit',
  'Quantity', 'Rate', 'Machinery Sub-Class / Model', 'Operator / Vendor',
  'IsWithGst', 'GstPercentage', 'Notes'
];

export default function AddEntryPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState(
    () => Object.fromEntries(CSV_COLUMNS.map(c => [c, true]))
  );
  const [showCustomizeSheet, setShowCustomizeSheet] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const fileInputRef = useRef(null);

  const entryTypes = [
    {
      id: 'material',
      title: 'Material',
      subtitle: 'Log concrete, steel, lumber, or site-specific procurement items.',
      iconPath: 'M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z',
      color: colors.primaryBlue,
    },
    {
      id: 'labour',
      title: 'Labour',
      subtitle: 'Track crew hours, specialized trade performance, and site presence.',
      iconPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      color: colors.primaryBlue,
    },
    {
      id: 'equipment',
      title: 'Equipment',
      subtitle: 'Record heavy machinery runtime, fuel logs, and maintenance events.',
      iconPath: 'M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14zM6 13h5v4H6v-4zm6-6h4v3h-4V7zM6 7h5v5H6V7zm6 4h4v6h-4v-6z',
      color: colors.primaryBlue,
    },
  ];

  const handleSelect = (id) => {
    setSelectedId(id);
    setTimeout(() => {
      navigate(`/manualentry?type=${id}`);
    }, 200);
  };

  const downloadCsvTemplate = (type) => {
    let headers, filename;
    if (type === 'material') {
      headers = MATERIAL_TEMPLATE_HEADERS;
      filename = 'material_entries_template.csv';
    } else if (type === 'labour') {
      headers = LABOUR_TEMPLATE_HEADERS;
      filename = 'labour_entries_template.csv';
    } else if (type === 'equipment') {
      headers = EQUIPMENT_TEMPLATE_HEADERS;
      filename = 'equipment_entries_template.csv';
    } else {
      headers = CSV_COLUMNS.filter(c => columnVisibility[c] ?? true);
      filename = 'all_entries_template.csv';
    }
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', minHeight: '100vh',
      fontFamily: typography.fontFamily, background: colors.bgBase4,
    }}>
      {/* Top Bar */}
      <div style={{
        background: colors.cardBg, borderBottom: `1px solid ${colors.cardBorder}`,
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate(-1)}
          style={{
            background: colors.bgBase4, border: 'none', borderRadius: 10,
            width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: colors.textPrimary,
          }}>
          &larr;
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>Add Entry</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.textLight }}>Record materials, labour, or equipment</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 100px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: colors.textPrimary,
            letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: 8,
          }}>
            What are you<br />adding?
          </h1>
          <p style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
            Select the entry type to log for the current shift.
          </p>
        </div>

        {/* Entry Type Section */}
        <div style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.3px',
          color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase',
        }}>
          Entry Type
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {entryTypes.map((type) => {
            const isSelected = selectedId === type.id;
            return (
              <Card
                key={type.id}
                hoverable
                onClick={() => handleSelect(type.id)}
                padding="16px"
                style={{
                  border: `1.5px solid ${isSelected ? type.color : '#E0E5FF'}`,
                  backgroundColor: isSelected ? '#F0F2FF' : '#F8F9FF',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    backgroundColor: `${type.color}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill={type.color}>
                      <path d={type.iconPath} />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: colors.textPrimary, marginBottom: 3 }}>
                      {type.title}
                    </h3>
                    <p style={{ fontSize: 13, lineHeight: 1.4, color: colors.textLight }}>
                      {type.subtitle}
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2" style={{ opacity: 0.5, flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bulk Import Section */}
        <div style={{
          background: colors.cardBg, borderRadius: 18,
          boxShadow: shadows.card, border: `1px solid #E5E7EB`,
          padding: 18, marginBottom: 16,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: `${colors.primaryBlue}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.primaryBlue} strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: colors.textLight, letterSpacing: '0.6em', textTransform: 'uppercase' }}>
                BULK ENTRY IMPORT
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary, marginTop: 2 }}>
                Upload bulk entries via CSV
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12.5, color: colors.textLight, lineHeight: 1.35, marginBottom: 18 }}>
            Import Materials, Labour, or Equipment entries. Download the clean template below, fill it, and upload the file.
          </p>

          {/* Download Template Button */}
          <button onClick={() => downloadCsvTemplate('all')}
            disabled={isUploadingCsv}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: `1.5px solid ${colors.primaryBlue}`,
              background: 'transparent', color: colors.primaryBlue,
              fontWeight: 700, fontSize: 14, cursor: isUploadingCsv ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 8,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Template
          </button>

          {/* Customize Template Columns */}
          <button onClick={() => setShowCustomizeSheet(true)}
            disabled={isUploadingCsv}
            style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'transparent', color: colors.primaryBlue,
              fontWeight: 700, fontSize: 12.5, cursor: isUploadingCsv ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginBottom: 8,
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Customize Template Columns
          </button>

          {/* Upload CSV Button */}
          <button onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCsv}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: gradients.primaryButton, color: '#FFF',
              fontWeight: 700, fontSize: 14, cursor: isUploadingCsv ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isUploadingCsv ? 0.7 : 1,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {isUploadingCsv ? 'Uploading...' : 'Upload CSV File'}
          </button>
        </div>

        {/* Inline CSV Import Component */}
        <CsvImport projectId={null} onComplete={() => {}} />
      </div>

      {/* Customize Template Columns Sheet */}
      {showCustomizeSheet && (
        <CustomizeTemplateSheet
          initialColumns={CSV_COLUMNS}
          initialVisibility={columnVisibility}
          onSave={(result) => {
            setColumnVisibility(result.visibility);
            setShowCustomizeSheet(false);
          }}
          onClose={() => setShowCustomizeSheet(false)}
        />
      )}
    </div>
  );
}

function CustomizeTemplateSheet({ initialColumns, initialVisibility, onSave, onClose }) {
  const [columns, setColumns] = useState([...initialColumns]);
  const [visibility, setVisibility] = useState({ ...initialVisibility });
  const [dragIndex, setDragIndex] = useState(null);
  const [newColumn, setNewColumn] = useState('');

  const toggleVisibility = (col) => {
    setVisibility(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const addColumn = () => {
    const trimmed = newColumn.trim();
    if (!trimmed || columns.includes(trimmed)) return;
    setColumns(prev => [...prev, trimmed]);
    setVisibility(prev => ({ ...prev, [trimmed]: true }));
    setNewColumn('');
  };

  const removeColumn = (col) => {
    setColumns(prev => prev.filter(c => c !== col));
    setVisibility(prev => { const n = { ...prev }; delete n[col]; return n; });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#FFF', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520,
        padding: '24px 24px 40px', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.textPrimary }}>Customize Template Columns</h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: colors.bgBase4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: colors.textLight,
          }}>✕</button>
        </div>

        {/* Add Column */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={newColumn} onChange={e => setNewColumn(e.target.value)}
            placeholder="Add custom column..."
            onKeyDown={e => e.key === 'Enter' && addColumn()}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: radius.sm,
              border: `1px solid ${colors.cardBorder}`, fontSize: 13, outline: 'none',
            }} />
          <button onClick={addColumn} style={{
            padding: '10px 16px', borderRadius: radius.sm, border: 'none',
            background: colors.primaryBlue, color: '#FFF', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>Add</button>
        </div>

        {/* Column List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {columns.map((col, idx) => (
            <div key={col} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              background: visibility[col] ? '#F8F9FF' : '#F5F5F5',
              borderRadius: radius.sm, border: `1px solid ${visibility[col] ? '#E0E5FF' : '#E5E5E5'}`,
              opacity: visibility[col] ? 1 : 0.6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2" style={{ cursor: 'grab', flexShrink: 0 }}>
                <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
              </svg>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{col}</span>
              <button onClick={() => toggleVisibility(col)} style={{
                width: 24, height: 24, borderRadius: 6, border: 'none',
                background: visibility[col] ? `${colors.primaryBlue}15` : '#E5E5E5',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: visibility[col] ? colors.primaryBlue : colors.textLight,
              }}>
                {visibility[col] ? '✓' : '✕'}
              </button>
              {!['Date', 'Project', 'Name', 'Type'].includes(col) && (
                <button onClick={() => removeColumn(col)} style={{
                  width: 24, height: 24, borderRadius: 6, border: 'none',
                  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#EF4444',
                }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <button onClick={() => onSave({ columns, visibility })}
          style={{
            width: '100%', padding: '14px', borderRadius: radius.md, border: 'none',
            background: gradients.primaryButton, color: '#FFF',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>
          Apply Customization
        </button>
      </div>
    </div>
  );
}
