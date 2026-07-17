import { useEffect } from 'react';
import { colors, radius, shadows, typography } from '../../styles/designTokens';

const iconMap = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

const colorMap = {
  success: { bg: colors.successLight, icon: colors.success, border: '#BBF7D0' },
  error: { bg: colors.dangerLight, icon: colors.danger, border: '#FECACA' },
  warning: { bg: colors.warningLight, icon: colors.warning, border: '#FDE68A' },
  info: { bg: colors.primaryLight, icon: colors.primary, border: '#C7D2FE' },
};

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const c = colorMap[type] || colorMap.info;

  return (
    <div
      style={{
        position: 'fixed', top: 20, right: 20, zIndex: 2000,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: colors.card,
        border: `1px solid ${c.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.lg,
        animation: 'fadeUp 200ms ease',
        maxWidth: 400,
      }}
    >
      <div
        style={{
          width: 24, height: 24, borderRadius: radius.full,
          background: c.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.icon, fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}
      >
        {iconMap[type] || 'i'}
      </div>
      <div style={{ fontSize: 14, color: colors.textPrimary, fontWeight: 500, flex: 1 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          width: 20, height: 20, borderRadius: radius.sm,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colors.textTertiary, fontSize: 12, cursor: 'pointer', flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
