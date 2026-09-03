import { useEffect } from 'react';
import { X } from 'lucide-react';
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
        background: 'rgba(17, 24, 39, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fadeIn 200ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.65)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: width,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 24px 0',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em' }}>{title}</div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: radius.md,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.textSecondary, cursor: 'pointer',
                transition: 'all 150ms ease',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.subtle;
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
