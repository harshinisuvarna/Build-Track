export const colors = {
  primary: '#6C63FF',
  primaryHover: '#5B55E8',
  primaryLight: '#ECEBFF',
  secondary: '#EEF2FF',
  background: '#F7F6FF',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E7E8F5',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMedium: '#4B5563',
  textDark: '#1F2937',
  textLight: '#6B7280',
  divider: '#E7E8F5',
  inputBorder: '#E7E8F5',
  iconBg: '#ECEBFF',
  border: '#E7E8F5',
  sidebarBg: '#FFFFFF',
  sidebarActive: '#ECEBFF',
  primarySurface: '#ECEBFF',
  navActiveItemBg: '#ECEBFF',
  navActiveBorder: '#6C63FF',
  navText: '#4B5563',
  navActiveText: '#6C63FF',
  badgeWarningBg: '#FFF4E0',
  badgeWarningText: '#B45309',
  badgeSuccessBg: '#E6F9F0',
  badgeSuccessText: '#15803D',
  badgePendingBg: '#FFF0D6',
  badgePendingText: '#92400E',
  badgeInfoBg: '#ECEBFF',
  badgeInfoText: '#6C63FF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#6C63FF',
  gradientStart: '#ECEBFF',
  gradientMid: '#EEF2FF',
  gradientEnd: '#F7F6FF',
  authStart: '#6C63FF',
  authMid: '#8B83FF',
  authEnd: '#B8B2FF',
  bgBase1: '#F7F6FF',
  bgBase2: '#F0EFFF',
  bgBase3: '#EEF2FF',
  bgBase4: '#F7F6FF',
  bgGlow1: '#FFFFFF',
  bgGlow2: '#6C63FF',
  bgGlow3: '#ECEBFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const shadows = {
  card: '0 2px 10px rgba(20,20,50,0.05)',
  premium: '0 2px 10px rgba(20,20,50,0.05)',
};

export const gradients = {
  primaryButton: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
  progressBar: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
  authBackground: `linear-gradient(135deg, ${colors.authStart} 0%, ${colors.authMid} 50%, ${colors.authEnd} 100%)`,
  navActiveItem: `linear-gradient(90deg, ${colors.navActiveItemBg} 0%, ${colors.primaryLight} 100%)`,
  pageBackground: `linear-gradient(135deg, ${colors.bgBase1} 0%, ${colors.bgBase3} 50%, ${colors.bgBase4} 100%)`,
};

export const typography = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  heading1: {
    fontSize: '32px',
    fontWeight: 900,
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
    color: colors.textPrimary,
  },
  heading2: {
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.3px',
    lineHeight: 1.2,
    color: colors.textPrimary,
  },
  heading3: {
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '-0.2px',
    lineHeight: 1.2,
    color: colors.textPrimary,
  },
  bodyLarge: {
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: 1.45,
    color: colors.textMedium,
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.1px',
    color: colors.textMedium,
  },
  caption: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.textSecondary,
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    color: colors.textSecondary,
  },
};

export const buttonStyles = {
  primary: {
    height: 48,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
    background: gradients.primaryButton,
    color: '#FFFFFF',
  },
  outline: {
    height: 48,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 16,
    border: `1.5px solid ${colors.primary}`,
    background: 'transparent',
    color: colors.primary,
    cursor: 'pointer',
  },
};

export const inputStyles = {
  borderRadius: radius.md,
  border: `1px solid ${colors.inputBorder}`,
  padding: '14px 16px',
  fontSize: 14,
  fontFamily: typography.fontFamily,
  backgroundColor: colors.cardBg,
  color: colors.textPrimary,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s ease',
};
