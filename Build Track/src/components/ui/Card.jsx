import { colors, radius, shadows } from '../../styles/designTokens';

export default function Card({ children, style, onClick, hoverable, padding }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.cardBg,
        borderRadius: radius.lg,
        border: `0.5px solid ${colors.cardBorder}`,
        boxShadow: shadows.card,
        padding: padding || '24px 28px',
        transition: hoverable ? 'transform 0.2s, box-shadow 0.2s' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = shadows.card;
        }
      }}
    >
      {children}
    </div>
  );
}
