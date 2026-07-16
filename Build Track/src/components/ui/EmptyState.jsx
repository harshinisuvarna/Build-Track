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
        padding: size === 'lg' ? '80px 24px' : '48px 24px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      {icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            background: colors.subtle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textTertiary,
            fontSize: 22,
          }}
        >
          {icon}
        </div>
      )}
      {title && (
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{title}</div>
      )}
      {description && (
        <div style={{ fontSize: 13.5, color: colors.textSecondary, maxWidth: 360, lineHeight: 1.5 }}>{description}</div>
      )}
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction} style={{ marginTop: 8 }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
