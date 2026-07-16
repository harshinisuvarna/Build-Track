import { colors } from '../../styles/designTokens';

export default function EmptyState({
  icon = '📦',
  title = 'No data found',
  description,
  action,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        animation: 'fadeUp 0.4s ease',
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginBottom: 16,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: colors.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            maxWidth: 360,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
