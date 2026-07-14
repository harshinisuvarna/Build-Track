import { colors, radius, gradients } from '../../styles/designTokens';

const styles = {
  primary: {
    height: 48,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
    background: gradients.primaryButton,
    color: '#FFFFFF',
    padding: '0 24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.2s, transform 0.15s',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    minWidth: 120,
  },
  outline: {
    height: 48,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 16,
    border: `1.5px solid ${colors.primaryBlue}`,
    background: 'transparent',
    color: colors.primaryBlue,
    cursor: 'pointer',
    padding: '0 24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.2s, color 0.2s',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    minWidth: 120,
  },
  danger: {
    height: 48,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
    background: colors.error,
    color: '#FFFFFF',
    padding: '0 24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.2s',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    minWidth: 120,
  },
  ghost: {
    height: 48,
    borderRadius: radius.md,
    fontWeight: 500,
    fontSize: 15,
    border: `1px solid ${colors.cardBorder}`,
    background: colors.cardBg,
    color: colors.textMedium,
    cursor: 'pointer',
    padding: '0 20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.2s, border-color 0.2s',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
};

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  onClick,
  style,
  fullWidth,
  ...props
}) {
  const base = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...base,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant !== 'ghost') {
          e.currentTarget.style.opacity = '0.85';
        }
        if (variant === 'ghost') {
          e.currentTarget.style.background = colors.sidebarActive;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant !== 'ghost') {
          e.currentTarget.style.opacity = '1';
        }
        if (variant === 'ghost') {
          e.currentTarget.style.background = colors.cardBg;
        }
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: 18,
            height: 18,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#FFF',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </button>
  );
}
