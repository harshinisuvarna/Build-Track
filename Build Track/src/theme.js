export const COLORS = {
  primary:        "#173EEA",
  primaryDark:    "#102BC0",
  primaryPurple:  "#B137FF",
  primaryLight:   "#67C8FF",

  background:     "#D8D4F0",
  backgroundMid:  "#D2CBF0",
  backgroundEnd:  "#E8E4F8",

  surface:        "#FFFFFF",
  cardBg:         "#FFFFFF",
  cardBorder:     "#EEEBF8",

  textPrimary:    "#1A1A2E",
  textMedium:     "#4B5563",
  textSecondary:  "#6B7280",
  textBlue:       "#173EEA",
  textAmount:     "#1A1A2E",

  divider:        "#E5E7EB",
  inputBorder:    "#E5E7EB",

  iconBg:         "#F3F0FF",
  sidebarActive:  "#EAE6F8",
  sidebarBg:      "#FFFFFF",

  success:        "#10B981",
  warning:        "#F59E0B",
  error:          "#EF4444",
  info:           "#3B82F6",

  badgeSuccessBg: "#E6F9F0",
  badgeSuccessText: "#15803D",
  badgeWarningBg: "#FFF4E0",
  badgeWarningText: "#B45309",
  badgePendingBg: "#FFF0D6",
  badgePendingText: "#92400E",
  badgeInfoBg:    "#EEF2FF",
  badgeInfoText:  "#173EEA",

  authStart:      "#8B9FE8",
  authMid:        "#B4A8EF",
  authEnd:        "#D8D2F4",
};

export const GRADIENTS = {
  primaryButton:  `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryPurple} 60%, ${COLORS.primaryLight} 100%)`,
  background:     `linear-gradient(180deg, ${COLORS.background} 0%, ${COLORS.backgroundMid} 50%, ${COLORS.backgroundEnd} 100%)`,
  authBg:         `linear-gradient(180deg, ${COLORS.authStart} 0%, ${COLORS.authMid} 50%, ${COLORS.authEnd} 100%)`,
};

export default COLORS;
