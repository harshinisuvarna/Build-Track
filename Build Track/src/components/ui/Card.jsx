import { colors, radius, shadows } from '../../styles/designTokens';

export default function Card({ children, style, onClick, hoverable, padding }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        borderRadius: radius.xl,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        padding: padding || spacingToPx(24),
        transition: 'box-shadow var(--transition), transform var(--transition)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.boxShadow = shadows.lg;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.boxShadow = shadows.sm;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}

function spacingToPx(n) { return `${n}px`; }
