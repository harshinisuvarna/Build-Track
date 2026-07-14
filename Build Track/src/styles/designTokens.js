export const colors = {
  primaryBlue: '#4361EE',
  primaryPurple: '#7B5EA7',
  primaryLightBlue: '#4CC9F0',

  /* Page backgrounds */
  bgBase1: '#F5F6FA',
  bgBase2: '#ECEEF5',
  bgBase3: '#F0F2F8',
  bgBase4: '#F5F6FA',

  /* Glow / auth */
  bgGlow1: '#FFFFFF',
  bgGlow2: '#C5CAFF',
  bgGlow3: '#E0D6FF',
  authStart: '#8B9FE8',
  authMid: '#B4A8EF',
  authEnd: '#D8D2F4',

  /* Cards */
  cardBg: '#FFFFFF',
  cardBorder: '#E8EAF0',

  /* Text */
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textBlue: '#4361EE',
  textAmount: '#111827',

  /* Badges */
  badgeWarningBg: '#FFF7ED',
  badgeWarningText: '#C2410C',
  badgeSuccessBg: '#F0FDF4',
  badgeSuccessText: '#15803D',
  badgePendingBg: '#FFFBEB',
  badgePendingText: '#92400E',
  badgeInfoBg: '#EEF2FF',
  badgeInfoText: '#4361EE',

  /* Sidebar */
  navActiveItemBg: '#EEF2FF',
  navActiveBorder: '#4361EE',
  navText: '#4B5563',
  navActiveText: '#4361EE',

  /* Misc */
  divider: '#E8EAF0',
  inputBorder: '#D1D5DB',
  iconBg: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  textMedium: '#374151',
  textDark: '#111827',
  textLight: '#9CA3AF',
  border: '#E8EAF0',

  gradientStart: '#F5F6FA',
  gradientMid: '#F0F2F8',
  gradientEnd: '#ECEEF5',

  sidebarBg: '#FFFFFF',
  sidebarActive: '#EEF2FF',
  primarySurface: '#F0F2FF',
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
  md: 10,
  lg: 14,
  xl: 20,
};

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  premium: '0 4px 16px rgba(0,0,0,0.06)',
  sidebar: '1px 0 0 #E8EAF0',
};

export const gradients = {
  primaryButton: `linear-gradient(135deg, #4361EE 0%, #7B5EA7 100%)`,
  progressBar: `linear-gradient(90deg, #4361EE 0%, #7B5EA7 100%)`,
  authBackground: `linear-gradient(135deg, #8B9FE8 0%, #B4A8EF 50%, #D8D2F4 100%)`,
  navActiveItem: `#EEF2FF`,
  pageBackground: `#F5F6FA`,
};

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  heading1: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.4px',
    lineHeight: 1.2,
    color: colors.textPrimary,
  },
  heading2: {
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.2px',
    lineHeight: 1.3,
    color: colors.textPrimary,
  },
  heading3: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    lineHeight: 1.3,
    color: colors.textPrimary,
  },
  bodyLarge: {
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.5,
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
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
};

export const buttonStyles = {
  primary: {
    height: 40,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    background: gradients.primaryButton,
    color: '#FFFFFF',
  },
  outline: {
    height: 40,
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: 14,
    border: `1.5px solid ${colors.primaryBlue}`,
    background: 'transparent',
    color: colors.primaryBlue,
    cursor: 'pointer',
  },
};

export const inputStyles = {
  borderRadius: radius.md,
  border: `1px solid ${colors.inputBorder}`,
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: typography.fontFamily,
  backgroundColor: colors.cardBg,
  color: colors.textPrimary,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s ease',
};
