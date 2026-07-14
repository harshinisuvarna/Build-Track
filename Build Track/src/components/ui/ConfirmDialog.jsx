import { colors, radius } from '../../styles/designTokens';
import Button from './Button';

export default function ConfirmDialog({
  open,
  message = 'Are you sure?',
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        style={{
          background: colors.cardBg,
          borderRadius: radius.lg,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: 400,
          padding: 28,
          animation: 'slideUp 0.25s ease',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 40,
            marginBottom: 12,
          }}
        >
          {danger ? '⚠️' : '❓'}
        </div>
        <p
          style={{
            fontSize: 15,
            color: colors.textPrimary,
            fontWeight: 500,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
