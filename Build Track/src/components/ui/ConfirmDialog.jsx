import { colors, radius, typography } from '../../styles/designTokens';
import Button from './Button';

export default function ConfirmDialog({ message, danger, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
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
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: 400,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          animation: 'fadeUp 200ms ease',
        }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: radius.lg,
            background: danger ? colors.dangerLight : colors.subtle,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: danger ? colors.danger : colors.textSecondary,
            fontSize: 18,
          }}
        >
          {danger ? '!' : '?'}
        </div>
        <div style={{ fontSize: 15, color: colors.textPrimary, fontWeight: 500, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" size="md" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm}>
            {confirmLabel || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}
