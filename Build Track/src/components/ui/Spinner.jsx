import { colors } from '../../styles/designTokens';

export default function Spinner({ size = 32, color = colors.primaryBlue, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span
        style={{
          width: size,
          height: size,
          border: `3px solid ${color}20`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }}
      />
    </div>
  );
}
