import { colors, radius, shadows, typography } from '../../styles/designTokens';

const sizeMap = {
  sm: { height: 32, fontSize: 13, padding: '0 12px' },
  md: { height: 38, fontSize: 14, padding: '0 16px' },
  lg: { height: 44, fontSize: 15, padding: '0 20px' },
};

const variantMap = {
  primary: { bg: colors.primary, color: colors.textInverse, hover: colors.primaryHover, border: 'none' },
  secondary: { bg: colors.subtle, color: colors.textPrimary, hover: '#E2E8F0', border: `1px solid ${colors.border}` },
  outline: { bg: 'transparent', color: colors.primary, hover: colors.primaryLight, border: `1px solid ${colors.border}` },
  ghost: { bg: 'transparent', color: colors.textSecondary, hover: colors.subtle, border: 'none' },
  danger: { bg: colors.danger, color: colors.textInverse, hover: '#DC2626', border: 'none' },
};

export default function Button({ children, variant = 'primary', size = 'md', icon, style, disabled, onClick, loading, fullWidth, type }) {
  const s = sizeMap[size];
  const v = variantMap[variant];
  return (
    <button
      type={type || 'button'}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: typography.fontFamily,
        borderRadius: radius.md,
        background: v.bg,
        color: v.color,
        border: v.border,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--transition)',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = v.hover; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = v.bg; } }}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', animation: 'spin 0.6s linear infinite' }}>⟳</span>
      ) : icon ? (
        <span style={{ display: 'inline-flex', fontSize: 16 }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
