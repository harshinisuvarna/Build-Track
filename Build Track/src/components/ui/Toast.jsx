import { useEffect } from 'react';
import { colors, radius } from '../../styles/designTokens';

const typeStyles = {
  success: { bg: '#E6F9F0', border: '#86EFAC', text: '#15803D', icon: '✅' },
  error: { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B', icon: '⚠️' },
  info: { bg: '#EEF2FF', border: '#93C5FD', text: '#173EEA', icon: 'ℹ️' },
  warning: { bg: '#FFF4E0', border: '#FDE68A', text: '#B45309', icon: '⚠️' },
};

export default function Toast({
  message,
  type = 'info',
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const t = typeStyles[type] || typeStyles.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        animation: 'toastSlideIn 0.3s ease',
        maxWidth: 400,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: radius.md,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        }}
      >
        <span>{t.icon}</span>
        <span style={{ color: t.text, fontSize: 14, fontWeight: 500, flex: 1 }}>
          {message}
        </span>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: t.text,
            fontSize: 16,
            opacity: 0.6,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
