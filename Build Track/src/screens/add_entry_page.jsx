import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, shadows, typography } from '../styles/designTokens';
import Card from '../components/ui/Card';

const entryTypes = [
  {
    id: 'material',
    title: 'Material',
    subtitle: 'Log concrete, steel, lumber, or site-specific procurement items.',
    icon: '📦',
    color: '#6C63FF',
    bgColor: '#ECEBFF',
  },
  {
    id: 'labour',
    title: 'Labour',
    subtitle: 'Track crew hours, specialized trade performance, and site presence.',
    icon: '👷',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
  },
  {
    id: 'equipment',
    title: 'Equipment',
    subtitle: 'Record heavy machinery runtime, fuel logs, and maintenance events.',
    icon: '🏗️',
    color: '#E65100',
    bgColor: '#FFF3E0',
  },
];

export default function AddEntryPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (id) => {
    setSelectedId(id);
    setTimeout(() => {
      navigate(`/manualentry?type=${id}`);
    }, 200);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 30,
          fontWeight: 900,
          color: colors.textPrimary,
          letterSpacing: '-0.6px',
          lineHeight: 1.15,
          marginBottom: 8,
        }}>
          What are you<br />adding?
        </h1>
        <p style={{
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 1.5,
        }}>
          Select the entry type to log for the current shift.
        </p>
      </div>

      <div style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.3px',
        color: colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        Entry Type
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  backgroundColor: isSelected ? `${type.color}18` : type.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  transition: 'background 0.2s',
                }}>
                  {type.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    marginBottom: 3,
                  }}>
                    {type.title}
                  </h3>
                  <p style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: colors.textSecondary,
                  }}>
                    {type.subtitle}
                  </p>
                </div>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: isSelected ? type.color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  {isSelected ? '✓' : '›'}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
