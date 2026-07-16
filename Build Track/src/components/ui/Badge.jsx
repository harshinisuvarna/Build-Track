import { colors, radius } from '../../styles/designTokens';

const variants = {
  success: { bg: colors.badgeSuccessBg, text: colors.badgeSuccessText },
  warning: { bg: colors.badgeWarningBg, text: colors.badgeWarningText },
  pending: { bg: colors.badgePendingBg, text: colors.badgePendingText },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  info: { bg: colors.badgeInfoBg, text: colors.badgeInfoText },
  neutral: { bg: '#F3F4F6', text: '#4B5563' },
};

export default function Badge({ children, variant = 'neutral', dot, style }) {
  const v = variants[variant] || variants.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: radius.sm,
        backgroundColor: v.bg,
        color: v.text,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: v.text,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
