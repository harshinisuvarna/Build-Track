export const colors = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  subtle: '#F1F5F9',
  hover: '#F8FAFC',
  primary: '#5B5CEB',
  primaryHover: '#4B4CDB',
  primaryLight: '#EEF0FF',
  primarySubtle: '#F5F6FF',
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  success: '#22C55E',
  successLight: '#F0FDF4',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#5B5CEB',
  infoLight: '#EEF0FF',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 };

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  md: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  lg: '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)',
  xl: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.04)',
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  h1: { fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: colors.textPrimary },
  h2: { fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: colors.textPrimary },
  h3: { fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25, color: colors.textPrimary },
  body: { fontSize: '15px', fontWeight: 400, lineHeight: 1.5, color: colors.textPrimary },
  caption: { fontSize: '13px', fontWeight: 500, lineHeight: 1.4, color: colors.textSecondary },
  label: { fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', color: colors.textSecondary },
};

// backward-compat aliases (will be removed after full migration)
export const gradients = {
  primaryButton: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
  progressBar: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
  navActiveItem: `linear-gradient(90deg, ${colors.subtle} 0%, ${colors.primaryLight} 100%)`,
  authBackground: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
  pageBackground: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.subtle} 100%)`,
};
export const buttonStyles = {
  primary: { height: 44, borderRadius: radius.md, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', background: gradients.primaryButton, color: '#FFFFFF' },
  outline: { height: 44, borderRadius: radius.md, fontWeight: 600, fontSize: 15, border: `1.5px solid ${colors.primary}`, background: 'transparent', color: colors.primary, cursor: 'pointer' },
};
export const inputStyles = {
  borderRadius: radius.md, border: `1px solid ${colors.border}`, padding: '12px 14px', fontSize: 14,
  fontFamily: typography.fontFamily, backgroundColor: colors.card, color: colors.textPrimary, outline: 'none', width: '100%',
};

// backward-compat aliases for old color names
colors.primaryBlue = colors.primary;
colors.primaryHover = colors.primaryHover;
colors.primaryLight = colors.primaryLight;
colors.background = colors.bg;
colors.cardBg = colors.card;
colors.cardBorder = colors.border;
colors.textLight = colors.textSecondary;
colors.textMedium = colors.textSecondary;
colors.textPrimary = colors.textPrimary;
colors.inputBorder = colors.border;
colors.divider = colors.border;
colors.gradientStart = colors.primaryLight;
colors.gradientMid = colors.subtle;
colors.gradientEnd = colors.bg;
colors.authStart = colors.primary;
colors.authMid = '#8B83FF';
colors.authEnd = '#B8B2FF';
colors.bgBase1 = colors.bg;
colors.bgBase2 = colors.subtle;
colors.bgBase3 = colors.subtle;
colors.bgBase4 = colors.bg;
colors.bgGlow1 = colors.card;
colors.bgGlow2 = colors.primary;
colors.bgGlow3 = colors.primaryLight;
colors.iconBg = colors.primaryLight;
colors.sidebarBg = colors.card;
colors.sidebarActive = colors.primaryLight;
colors.primarySurface = colors.primaryLight;
colors.navActiveItemBg = colors.primaryLight;
colors.navActiveBorder = colors.primary;
colors.navText = colors.textSecondary;
colors.navActiveText = colors.primary;
colors.badgeWarningBg = colors.warningLight;
colors.badgeWarningText = '#B45309';
colors.badgeSuccessBg = colors.successLight;
colors.badgeSuccessText = '#15803D';
colors.badgePendingBg = colors.warningLight;
colors.badgePendingText = '#92400E';
colors.badgeInfoBg = colors.primaryLight;
colors.badgeInfoText = colors.primary;
