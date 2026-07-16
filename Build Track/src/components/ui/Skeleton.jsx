import { colors, radius } from '../../styles/designTokens';

function SkeletonBase({ width, height, borderRadius, style }) {
  return (
    <div
      style={{
        width: width || '100%',
        height: height || 16,
        borderRadius: borderRadius || radius.sm,
        background: `linear-gradient(90deg, ${colors.subtle} 25%, #E2E8F0 50%, ${colors.subtle} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonLine({ width = '100%', height = 14, style }) {
  return <SkeletonBase width={width} height={height} style={style} />;
}

export function SkeletonBlock({ width = '100%', height = 80, style }) {
  return <SkeletonBase width={width} height={height} borderRadius={radius.lg} style={style} />;
}

export function SkeletonCard({ style }) {
  return (
    <div
      style={{
        padding: 24,
        background: colors.card,
        borderRadius: radius.xl,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      <SkeletonBase width="40%" height={14} />
      <SkeletonBase width="60%" height={28} />
      <SkeletonBase width="30%" height={12} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      <div style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBase key={i} width={`${100 / cols}%`} height={14} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBase key={c} width={`${100 / cols}%`} height={12} opacity={0.5} />
          ))}
        </div>
      ))}
    </div>
  );
}
