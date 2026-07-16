import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Bell, Settings } from "lucide-react";

export default function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)", zIndex: 40,
            animation: "fadeIn 150ms ease",
          }}
        />
      )}

      {isMobile ? (
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 200ms ease",
        }}>
          <Sidebar />
        </div>
      ) : (
        <Sidebar />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Top bar */}
        <header
          style={{
            height: 56,
            borderBottom: "1px solid #E5E7EB",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 32, height: 32, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64748B", cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => navigate("/notifications")}
              style={{
                width: 34, height: 34, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64748B", cursor: "pointer",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Bell size={16} />
            </button>
            <button
              onClick={() => navigate("/settings")}
              style={{
                width: 34, height: 34, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64748B", cursor: "pointer",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
