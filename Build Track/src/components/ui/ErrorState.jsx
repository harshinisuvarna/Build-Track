import { AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../styles/designTokens';
import Button from './Button';

export default function ErrorState({ title, message, onRetry }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        background: colors.card,
        border: `1px solid ${colors.dangerLight}`,
        borderRadius: '12px',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.lg,
          background: colors.dangerLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.danger,
        }}
      >
        <AlertTriangle size={24} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {title && (
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>{title}</div>
        )}
        {message && (
          <div style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 400, lineHeight: 1.5 }}>{message}</div>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} style={{ marginTop: 4 }}>
          Try Again
        </Button>
      )}
    </div>
  );
}

