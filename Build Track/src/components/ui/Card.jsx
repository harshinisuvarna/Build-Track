import { colors, radius, shadows } from '../../styles/designTokens';

export default function Card({ children, style, onClick, hoverable, padding }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        borderRadius: "14px",
        border: `1px solid ${colors.border}`,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)",
        padding: padding !== undefined ? padding : 24,
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.boxShadow = "0 10px 20px -8px rgba(23, 62, 234, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)";
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.borderColor = "#173EEA33";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)";
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      {children}
    </div>
  );
}

