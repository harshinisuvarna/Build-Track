import { colors, radius, shadows, glass } from '../../styles/designTokens';

export default function Card({ children, style, onClick, hoverable, padding }) {
  const isInteractive = hoverable || onClick;
  
  return (
    <div
      onClick={onClick}
      style={{
        background: glass.background,
        backdropFilter: glass.backdropFilter,
        WebkitBackdropFilter: glass.WebkitBackdropFilter,
        borderRadius: "14px",
        border: glass.border,
        boxShadow: "var(--shadow-sm)",
        padding: padding !== undefined ? padding : 24,
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.75)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.82)";
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive) {
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.55)";
          e.currentTarget.style.background = "var(--glass-bg)";
        }
      }}
    >
      {children}
    </div>
  );
}
