import { colors, radius, typography } from '../../styles/designTokens';

export default function Input({
  label, error, icon, type = 'text', style, containerStyle, ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', ...containerStyle }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>{label}</label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, color: colors.textTertiary, display: 'flex', fontSize: 16, pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          {...props}
          style={{
            width: '100%',
            height: 40,
            padding: icon ? '0 14px 0 38px' : '0 14px',
            fontSize: 14,
            fontWeight: 400,
            fontFamily: typography.fontFamily,
            color: colors.textPrimary,
            background: colors.card,
            border: `1px solid ${error ? colors.danger : colors.border}`,
            borderRadius: radius.md,
            outline: 'none',
            transition: 'border-color var(--transition), box-shadow var(--transition)',
            boxShadow: error ? `0 0 0 2px ${colors.dangerLight}` : 'none',
            ...style,
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 2px ${error ? colors.dangerLight : colors.primaryLight}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? colors.danger : colors.border;
            if (!error) e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: colors.danger, fontWeight: 500 }}>{error}</span>}
    </div>
  );
}
