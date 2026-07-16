import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { navItems, adminNavItems } from "../navItems";
import { resolveImageUrl } from "../utils/imageUrl";
import { LogOut, Building2 } from "lucide-react";

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 12px",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
  transition: "all 150ms ease",
  marginBottom: 2,
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
        width: 240,
        minWidth: 240,
        background: "#fff",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 24px" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#5B5CEB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={16} color="#fff" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#111827", letterSpacing: "-0.03em" }}>
          BuildTrack
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.05em", padding: "0 4px 8px", textTransform: "uppercase" }}>
          Main
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              ...linkStyle,
              color: isActive ? "#5B5CEB" : "#64748B",
              background: isActive ? "#EEF0FF" : "transparent",
              fontWeight: isActive ? 600 : 500,
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.dataset.active) {
                e.currentTarget.style.background = "#F1F5F9";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.dataset.active) {
                e.currentTarget.style.background = "transparent";
              }
            }}
            data-active={undefined}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {isAdminOrSupervisor && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.05em", padding: "20px 4px 8px", textTransform: "uppercase" }}>
              Admin
            </div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                style={({ isActive }) => ({
                  ...linkStyle,
                  color: isActive ? "#5B5CEB" : "#64748B",
                  background: isActive ? "#EEF0FF" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.dataset.active) {
                    e.currentTarget.style.background = "#F1F5F9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.dataset.active) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Profile Footer */}
      <div style={{ borderTop: "1px solid #E5E7EB", padding: "12px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F1F5F9",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "#64748B",
              flexShrink: 0,
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              {user?.role || "Admin"}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
