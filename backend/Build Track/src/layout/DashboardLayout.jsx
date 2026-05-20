import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            background: "rgba(0,0,0,0.4)",
            zIndex: 40,
            transition: "opacity 0.2s ease",
          }}
        />
      )}


      {isMobile ? (
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}>
          <Sidebar collapsed={false} onToggle={() => setSidebarOpen(false)} />
        </div>
      ) : (
        <Sidebar collapsed={false} />
      )}


      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>

        {isMobile && (
          <div style={{
            background: "#fff",
            borderBottom: "1px solid #ebebeb",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "1px solid #e5e5e5",
                borderRadius: 8, padding: "6px 10px",
                cursor: "pointer", fontSize: 18, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ☰
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>BuildTrack</span>
          </div>
        )}
        <div style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}