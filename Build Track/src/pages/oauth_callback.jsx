// src/pages/oauth_callback.jsx
// This page is the landing page after Google/GitHub OAuth redirect.
//
// Flow:
//   1. Backend OAuth callback generates a JWT token
//   2. Backend redirects to: /oauth/callback?token=eyJ...
//   3. This page reads the token from the URL
//   4. Stores it in localStorage (same key as email login: "bt_token")
//   5. Redirects to the dashboard
//
// If anything goes wrong, redirects to /login with error message.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    const run = async () => {
      try {
        // Read token from URL — backend puts it here after OAuth
        const params = new URLSearchParams(window.location.search);
        const token  = params.get("token");
        const error  = params.get("error");

        if (error) {
          setStatus("OAuth failed. Redirecting to login…");
          setTimeout(() => navigate("/login?error=" + error), 1500);
          return;
        }

        if (!token) {
          setStatus("No token received. Redirecting to login…");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }

        // Store the JWT — same key used by email login
        localStorage.setItem("bt_token", token);

        // Fetch the user profile so we can store it too
        try {
          const { data } = await authAPI.me();
          localStorage.setItem("bt_user", JSON.stringify(data.user));
        } catch {
          // Not critical — dashboard will fetch it again if needed
        }

        setStatus("Success! Taking you to your dashboard…");

        // Small delay so the user sees the success message
        setTimeout(() => {
          window.location.href = "/";
        }, 800);

      } catch (err) {
        setStatus("Something went wrong. Redirecting…");
        setTimeout(() => navigate("/login"), 1500);
      }
    };

    run();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      gap: 24,
    }}>
      {/* Spinner */}
      <div style={{
        width: 52,
        height: 52,
        border: "4px solid rgba(234,88,12,0.2)",
        borderTopColor: "#ea580c",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />

      {/* Logo */}
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px" }}>
        <span style={{ color: "#fff" }}>Build</span>
        <span style={{ color: "#ea580c" }}>Track</span>
      </div>

      {/* Status text */}
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, margin: 0 }}>
        {status}
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
