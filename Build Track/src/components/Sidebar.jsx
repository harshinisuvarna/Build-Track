import { NavLink } from "react-router-dom";
import { navItems } from "../navItems";

/* ── BuildTrack Logo Icon ── */
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

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 210,
        background: "#fff",
        borderRight: "1px solid #eee",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <LogoIcon />
        <div>
          <div style={{ fontWeight: 700 }}>BuildTrack</div>
          <div style={{ fontSize: 10, color: "#999" }}>MANAGEMENT</div>
        </div>
      </div>

      {/* Navigation */}
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          style={({ isActive }) => ({
            padding: "10px 14px",
            borderRadius: 10,
            textDecoration: "none",
            display: "flex",
            gap: 10,
            color: isActive ? "#fff" : "#555",
            background: isActive ? "#ea580c" : "transparent",
            marginBottom: 4
          })}
        >
          {item.icon} {item.label}
        </NavLink>
      ))}

      {/* User */}
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#fdba74", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>👤</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Rajesh Kumar</div>
            <div style={{ fontSize: 11, color: "#888" }}>Site Supervisor</div>
          </div>
        </div>
    </aside>
  );
}
