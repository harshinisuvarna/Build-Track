import { colors, radius } from '../../styles/designTokens';

export function SkeletonLine({ width = '100%', height = 14, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius.sm,
        background: `linear-gradient(90deg, ${colors.cardBorder} 25%, ${colors.iconBg} 50%, ${colors.cardBorder} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
        marginBottom: 8,
        ...style,
      }}
    />
  );
}

export function SkeletonBlock({ width = '100%', height = 100, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius.md,
        background: `linear-gradient(90deg, ${colors.cardBorder} 25%, ${colors.iconBg} 50%, ${colors.cardBorder} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ style }) {
  return (
    <div
      style={{
        background: colors.cardBg,
        borderRadius: radius.lg,
        border: `0.5px solid ${colors.cardBorder}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        padding: '24px 28px',
        ...style,
      }}
    >
      <SkeletonLine width="60%" height={20} />
      <SkeletonLine width="40%" height={14} />
      <div style={{ height: 12 }} />
      <SkeletonLine width="90%" height={14} />
      <SkeletonLine width="70%" height={14} />
      <div style={{ height: 8 }} />
      <SkeletonBlock height={8} style={{ borderRadius: 4 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, style }) {
  return (
    <div style={style}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 16,
            padding: '12px 0',
            borderBottom: i < rows - 1 ? `1px solid ${colors.divider}` : 'none',
          }}
        >
          <SkeletonLine width="25%" height={14} />
          <SkeletonLine width="20%" height={14} />
          <SkeletonLine width="15%" height={14} />
          <SkeletonLine width="15%" height={14} />
          <SkeletonLine width="10%" height={14} />
        </div>
      ))}
    </div>
  );
}
