import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { navItems } from "../navItems";
import { resolveImageUrl } from "../utils/imageUrl";


function LogoIcon({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(145deg, #f97316, #ea580c)",
      borderRadius: size * 0.25,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 8px rgba(234,88,12,0.35)",
      flexShrink: 0,
    }}>
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6"  y="10" width="24" height="22" rx="2" fill="white" />
        <polygon points="18,2 32,11 4,11" fill="white" />
        <rect x="9"  y="15" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="22" y="15" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="9"  y="23" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="22" y="23" width="5" height="5" rx="1" fill="#ea580c" />
        <rect x="14" y="24" width="8" height="8" rx="1" fill="#ea580c" />
      </svg>
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();

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

  const photoUrl = user?.profilePhoto
    ? resolveImageUrl(user.profilePhoto)
    : null;


  const handleLogout = () => {
    localStorage.removeItem("bt_token");
    localStorage.removeItem("bt_user");
    window.location.assign("/login");
  };

  return (
    <aside
      style={{
        width: collapsed ? 0 : 210,
        minWidth: collapsed ? 0 : 210,
        background: "#fff",
        borderRight: collapsed ? "none" : "1px solid #eee",
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

      <div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <LogoIcon />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>BuildTrack</div>
            <div style={{ fontSize: 10, color: "#999" }}>MANAGEMENT</div>
          </div>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === "/"}
            style={({ isActive }) => ({
              padding: "10px 14px",
              borderRadius: 10,
              textDecoration: "none",
              display: "flex",
              gap: 10,
              color: isActive ? "#fff" : "#555",
              background: isActive ? "#ea580c" : "transparent",
              marginBottom: 4,
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              transition: "background 0.15s, color 0.15s",
            })}
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </div>


      <div style={{
        marginTop: "auto",
        padding: "16px 0 0",
        borderTop: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#fdba74", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>
            {photoUrl
              ? <img src={photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "👤"
            }
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.role || "Site Supervisor"}
            </div>
          </div>
        </div>


        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "9px 14px",
            background: "#fff5f0",
            border: "1px solid #fde4d0",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#ea580c",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#dc2626"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff5f0"; e.currentTarget.style.borderColor = "#fde4d0"; e.currentTarget.style.color = "#ea580c"; }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}