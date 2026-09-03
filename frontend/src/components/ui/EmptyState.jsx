import { colors, radius, typography } from '../../styles/designTokens';
import Button from './Button';

export default function EmptyState({
  icon, title, description, actionLabel, onAction, size = 'md'
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'lg' ? '64px 24px' : '40px 24px',
        textAlign: 'center',
        background: colors.card,
        border: `1px dashed ${colors.border}`,
        borderRadius: '12px',
        gap: 16,
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            background: colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {title && (
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.01em' }}>{title}</div>
        )}
        {description && (
          <div style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 360, lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction} style={{ marginTop: 4 }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
