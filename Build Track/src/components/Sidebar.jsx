import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { navItems, adminNavItems } from "../navItems";
import { resolveImageUrl } from "../utils/imageUrl";
import { LogOut } from "lucide-react";

const navLinkBase = {
  padding: "10px 16px",
  borderRadius: "12px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 6,
  fontSize: "13.5px",
  fontWeight: "600",
  transition: "all 0.2s ease",
};

export default function Sidebar({ collapsed }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("bt_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("bt_user");
      if (stored) setUser(JSON.parse(stored));
    };
    window.addEventListener("userUpdated", syncUser);
    return () => window.removeEventListener("userUpdated", syncUser);
  }, []);

  const photoUrl = user?.profilePhoto ? resolveImageUrl(user.profilePhoto) : null;

  const handleLogout = () => {
    localStorage.removeItem("bt_token");
    localStorage.removeItem("bt_user");
    window.location.assign("/login");
  };

  const isAdminOrSupervisor = user?.role === "admin" || user?.role === "supervisor";

  return (
    <aside
      style={{
        width: collapsed ? 0 : 230,
        minWidth: collapsed ? 0 : 230,
        background: "#FFFFFF",
        borderRight: "1px solid #E7E8F5",
        padding: collapsed ? 0 : "24px 16px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        boxSizing: "border-box",
        flexShrink: 0,
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        
        {/* Modern Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 6 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #6C63FF 0%, #8B83FF 100%)",
            borderRadius: "9px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(108, 99, 255, 0.25)",
            flexShrink: 0,
          }}>
            <span style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 16 }}>B</span>
          </div>
          <div>
            <div style={{ fontWeight: "900", fontSize: 17.5, color: "#1F2937", letterSpacing: "-0.5px", lineHeight: "1" }}>
              BuildTrack
            </div>
            <div style={{ fontSize: "9.5px", fontWeight: "700", color: "#6B7280", letterSpacing: "1px", marginTop: 3 }}>
              MANAGEMENT
            </div>
          </div>
        </div>

        {/* OPERATIONS Group */}
        <div style={{
          fontSize: "10px", fontWeight: "800", letterSpacing: "1.2px",
          color: "#9CA3AF", margin: "16px 8px 10px",
          textTransform: "uppercase",
        }}>
          Operations
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              ...navLinkBase,
              color: isActive ? "#6C63FF" : "#4B5563",
              background: isActive ? "#ECEBFF" : "transparent",
              boxShadow: "none",
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.className.includes("active")) {
                e.currentTarget.style.background = "#F3F4F6";
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.className.includes("active")) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* GOVERNANCE & DATA Group */}
        {isAdminOrSupervisor && (
          <>
            <div style={{
              fontSize: "10px", fontWeight: "800", letterSpacing: "1.2px",
              color: "#9CA3AF", margin: "24px 8px 10px",
              textTransform: "uppercase",
            }}>
              Governance & Data
            </div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                style={({ isActive }) => ({
                  ...navLinkBase,
                  color: isActive ? "#6C63FF" : "#4B5563",
                  background: isActive ? "#ECEBFF" : "transparent",
                  boxShadow: "none",
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.className.includes("active")) {
                    e.currentTarget.style.background = "#F3F4F6";
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.className.includes("active")) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </div>

      {/* Footer Profile card */}
      <div style={{
        marginTop: "auto",
        padding: "16px 8px 0",
        borderTop: "1px solid #E7E8F5",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#F3F4F6", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
            border: "1.5px solid #E7E8F5"
          }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "👤"
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: "11px", color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.role || "Admin"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "9px 12px",
            background: "#F9FAFB",
            border: "1.5px solid #E7E8F5",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: "700",
            color: "#4B5563",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#F3F4F6";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#F9FAFB";
            e.currentTarget.style.borderColor = "#E7E8F5";
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
