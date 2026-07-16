import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { navItems, adminNavItems } from "../navItems";
import { resolveImageUrl } from "../utils/imageUrl";
import { LogOut, Building2 } from "lucide-react";
import { colors, gradients, radius, typography } from "../styles/designTokens";

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 16px",
  borderRadius: "12px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
  marginBottom: 4,
};

export default function Sidebar() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("bt_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem("bt_user");
        if (stored) setUser(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener("userUpdated", syncUser);
    return () => window.removeEventListener("userUpdated", syncUser);
  }, []);

  const photoUrl = user?.profilePhoto ? resolveImageUrl(user.profilePhoto) : null;
  const isAdminOrSupervisor = user?.role === "admin" || user?.role === "supervisor";

  const handleLogout = () => {
    localStorage.removeItem("bt_token");
    localStorage.removeItem("bt_user");
    window.location.assign("/login");
  };

  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        background: colors.card,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 20px 20px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: gradients.primaryGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 10px rgba(23, 62, 234, 0.25)",
          }}
        >
          <Building2 size={18} color="#fff" />
        </div>
        <span style={{ fontSize: 19, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em", fontFamily: typography.fontFamily }}>
          BuildTrack
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.08em", padding: "12px 8px 6px", textTransform: "uppercase" }}>
          Main
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              ...linkStyle,
              color: isActive ? "#FFFFFF" : colors.textSecondary,
              background: isActive ? gradients.primaryGradient : "transparent",
              boxShadow: isActive ? "0 8px 16px -4px rgba(23, 62, 234, 0.35)" : "none",
              fontWeight: isActive ? 600 : 500,
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.getAttribute("class")?.includes("active")) {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = colors.textPrimary;
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.getAttribute("class")?.includes("active")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.textSecondary;
              }
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} color={isActive ? "#FFFFFF" : colors.textSecondary} style={{ transition: "color 200ms" }} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {isAdminOrSupervisor && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.textTertiary, letterSpacing: "0.08em", padding: "20px 8px 6px", textTransform: "uppercase" }}>
              Admin
            </div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                style={({ isActive }) => ({
                  ...linkStyle,
                  color: isActive ? "#FFFFFF" : colors.textSecondary,
                  background: isActive ? gradients.primaryGradient : "transparent",
                  boxShadow: isActive ? "0 8px 16px -4px rgba(23, 62, 234, 0.35)" : "none",
                  fontWeight: isActive ? 600 : 500,
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.getAttribute("class")?.includes("active")) {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = colors.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.getAttribute("class")?.includes("active")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = colors.textSecondary;
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} color={isActive ? "#FFFFFF" : colors.textSecondary} style={{ transition: "color 200ms" }} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Profile Footer */}
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#F1F5F9",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: colors.textSecondary,
              flexShrink: 0,
              border: `2px solid ${colors.border}`,
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, textTransform: "capitalize" }}>
              {user?.role || "Admin"}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            fontSize: 13,
            fontWeight: 600,
            color: colors.textSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            border: `1px solid ${colors.border}`,
            background: "transparent",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FEF2F2";
            e.currentTarget.style.color = colors.danger;
            e.currentTarget.style.borderColor = "#FEE2E2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = colors.textSecondary;
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

