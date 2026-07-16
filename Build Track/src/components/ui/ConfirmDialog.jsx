import { AlertTriangle, HelpCircle } from 'lucide-react';
import { colors, radius, typography } from '../../styles/designTokens';
import Button from './Button';

export default function ConfirmDialog({ message, danger, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(17, 24, 39, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fadeIn 150ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card,
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: 400,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'fadeUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            width: 44, height: 44, borderRadius: radius.lg,
            background: danger ? colors.dangerLight : colors.primaryLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: danger ? colors.danger : colors.primary,
          }}
        >
          {danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
        </div>
        <div style={{ fontSize: 15, color: colors.textPrimary, fontWeight: 600, lineHeight: 1.5, fontFamily: typography.fontFamily }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button variant="ghost" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm}>
            {confirmLabel || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}

