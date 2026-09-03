import { colors, typography } from '../../styles/designTokens';

export default function Spinner({ size = 20, color = colors.primary, style }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${colors.border}`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        ...style,
      }}
    />
  );
}
