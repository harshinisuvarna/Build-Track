import { useEffect } from 'react';
import { colors, radius, shadows } from '../../styles/designTokens';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fadeIn 150ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card,
          borderRadius: radius.xl,
          boxShadow: shadows.xl,
          width: '100%',
          maxWidth: width,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeUp 200ms ease',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px 0',
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 600, color: colors.textPrimary }}>{title}</div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: radius.sm,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textTertiary, fontSize: 16, cursor: 'pointer',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.subtle; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
