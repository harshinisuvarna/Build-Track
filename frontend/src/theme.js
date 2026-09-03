export const COLORS = {
  primary:        "#6366f1",
  primaryDark:    "#4f46e5",
  primaryPurple:  "#a855f7",
  primaryLight:   "#a855f7",

  background:     "#e0e7ff",
  backgroundMid:  "#ede9fe",
  backgroundEnd:  "#f5f3ff",

  surface:        "rgba(255, 255, 255, 0.6)",
  cardBg:         "rgba(255, 255, 255, 0.6)",
  cardBorder:     "rgba(255, 255, 255, 0.4)",

  textPrimary:    "#1A1A2E",
  textMedium:     "#4B5563",
  textSecondary:  "#6B7280",
  textBlue:       "#6366f1",
  textAmount:     "#1A1A2E",

  divider:        "#E5E7EB",
  inputBorder:    "#E5E7EB",

  iconBg:         "#F3F0FF",
  sidebarActive:  "#EAE6F8",
  sidebarBg:      "rgba(255, 255, 255, 0.6)",

  success:        "#10B981",
  warning:        "#F59E0B",
  error:          "#EF4444",
  info:           "#6366f1",

  badgeSuccessBg: "#E6F9F0",
  badgeSuccessText: "#15803D",
  badgeWarningBg: "#FFF4E0",
  badgeWarningText: "#B45309",
  badgePendingBg: "#FFF0D6",
  badgePendingText: "#92400E",
  badgeInfoBg:    "#EEF2FF",
  badgeInfoText:  "#6366f1",

  authStart:      "#6366f1",
  authMid:        "#a855f7",
  authEnd:        "#c084fc",
};

export const GRADIENTS = {
  primaryButton:  `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryPurple} 100%)`,
  background:     `radial-gradient(circle at top right, #e0e7ff, #ffffff)`,
  authBg:         `linear-gradient(135deg, ${COLORS.authStart} 0%, ${COLORS.authEnd} 100%)`,
};

export default COLORS;
