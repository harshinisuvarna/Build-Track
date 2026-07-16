import { colors, radius } from '../../styles/designTokens';
import Button from './Button';

export default function ErrorState({ title, message, onRetry }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          background: colors.dangerLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.danger,
          fontSize: 22,
        }}
      >
        !
      </div>
      {title && <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{title}</div>}
      {message && <div style={{ fontSize: 13.5, color: colors.textSecondary, maxWidth: 400, lineHeight: 1.5 }}>{message}</div>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} style={{ marginTop: 8 }}>
          Try Again
        </Button>
      )}
    </div>
  );
}
