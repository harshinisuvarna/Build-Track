import { colors, radius, typography } from '../../styles/designTokens';

export default function Input({
  label, error, icon, type = 'text', style, containerStyle, ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', ...containerStyle }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, letterSpacing: '0.02em' }}>{label}</label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 16, color: colors.textTertiary, display: 'flex', fontSize: 18, pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          {...props}
          style={{
            width: '100%',
            height: 48,
            padding: icon ? '0 16px 0 46px' : '0 16px',
            fontSize: 14,
            fontWeight: 400,
            fontFamily: typography.fontFamily,
            color: colors.textPrimary,
            background: colors.card,
            border: `1px solid ${error ? colors.danger : colors.border}`,
            borderRadius: radius.lg, // 12px
            outline: 'none',
            transition: 'all 150ms ease',
            boxShadow: error ? `0 0 0 3px ${colors.dangerLight}` : '0 1px 2px rgba(0, 0, 0, 0.02)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? colors.danger : colors.primary;
            e.currentTarget.style.boxShadow = error
              ? `0 0 0 3px ${colors.dangerLight}`
              : `0 0 0 3px rgba(23, 62, 234, 0.15)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? colors.danger : colors.border;
            e.currentTarget.style.boxShadow = error ? `0 0 0 3px ${colors.dangerLight}` : '0 1px 2px rgba(0, 0, 0, 0.02)';
          }}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: colors.danger, fontWeight: 500, marginTop: 2 }}>{error}</span>}
    </div>
  );
}

