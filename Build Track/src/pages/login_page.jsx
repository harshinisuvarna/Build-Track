import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, API_ORIGIN } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Building,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// GPU-Accelerated Canvas Blueprint Background drawing grids, coordinates & drifting auroras
function BlueprintBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Drifting aurora radial gradient blobs
    let blobs = [
      { x: width * 0.2, y: height * 0.3, vx: 0.35, vy: 0.25, r: 350, color: "rgba(99, 102, 241, 0.15)" },
      { x: width * 0.8, y: height * 0.7, vx: -0.25, vy: 0.3, r: 400, color: "rgba(139, 92, 246, 0.12)" },
      { x: width * 0.5, y: height * 0.8, vx: 0.2, vy: -0.2, r: 320, color: "rgba(6, 182, 212, 0.08)" }
    ];

    const draw = () => {
      // Clear base with OLED-black space base
      ctx.fillStyle = "#030308";
      ctx.fillRect(0, 0, width, height);

      // Dampen mouse coordinates for liquid inertia spotlight flow
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;

      // Draw drifting blobs
      blobs.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > width) b.vx *= -1;
        if (b.y < 0 || b.y > height) b.vy *= -1;

        const radGrd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        radGrd.addColorStop(0, b.color);
        radGrd.addColorStop(1, "transparent");
        ctx.fillStyle = radGrd;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Interactive mouse light spotlight
      const spotGrd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 350);
      spotGrd.addColorStop(0, "rgba(99, 102, 241, 0.08)");
      spotGrd.addColorStop(1, "transparent");
      ctx.fillStyle = spotGrd;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 350, 0, Math.PI * 2);
      ctx.fill();

      // Blueprint lines
      ctx.strokeStyle = "rgba(99, 102, 241, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 56;
      
      // Verticals
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontals
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Small details: coordinates dots
      ctx.fillStyle = "rgba(99, 102, 241, 0.18)";
      for (let x = gridSize; x < width; x += gridSize * 4) {
        for (let y = gridSize; y < height; y += gridSize * 4) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} />;
}

// Custom Input field wrapper containing floating label animations and expanding underline glows
function PremiumInput({ icon: Icon, label, error, ...props }) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(10, 10, 20, 0.55)",
          border: `1.2px solid ${error ? "#EF4444" : focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 12,
          padding: "12px 14px",
          position: "relative",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: focused ? "0 0 16px rgba(99, 102, 241, 0.1)" : "none"
        }}
      >
        {Icon && <Icon size={17} style={{ color: focused ? "#818CF8" : "#4B5563", marginRight: 10, flexShrink: 0 }} />}
        
        <input 
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "#FFF",
            fontSize: "14px",
            fontFamily: "inherit",
            padding: "4px 0",
            zIndex: 10
          }}
        />

        {/* Expanding bottom accent highlight line */}
        <div 
          style={{
            position: "absolute",
            bottom: -1,
            left: "50%",
            width: focused ? "100%" : "0%",
            height: 1.5,
            background: error ? "#EF4444" : "linear-gradient(90deg, #6366F1 0%, #06B6D4 100%)",
            transform: "translateX(-50%)",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 20
          }}
        />

        {/* Floating Label placeholder */}
        <label 
          style={{
            position: "absolute",
            left: Icon ? 41 : 14,
            top: (focused || hasValue || props.value) ? "1.5px" : "13.5px",
            fontSize: (focused || hasValue || props.value) ? "9.5px" : "13px",
            color: error ? "#EF4444" : (focused ? "#818CF8" : "#6B7280"),
            fontWeight: "700",
            pointerEvents: "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            textTransform: (focused || hasValue || props.value) ? "uppercase" : "none",
            letterSpacing: (focused || hasValue || props.value) ? "0.08em" : "normal"
          }}
        >
          {label}
        </label>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, color: "#EF4444", fontSize: "11.5px", fontWeight: "700", animation: "slideDown 0.2s ease" }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Google OAuth vector icon
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Authentication Fields State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Errors state
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");
  const [serverErr, setServerErr] = useState("");

  // Forgot Password Drawer state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Layout responsiveness tracking
  const [vw, setVw] = useState(window.innerWidth);

  // Live KPI mockup stats animation parameters
  const [progressVal, setProgressVal] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("bt_token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Trigger KPI progress load on mount
  useEffect(() => {
    const t = setTimeout(() => setProgressVal(78), 250);
    return () => clearTimeout(t);
  }, []);

  const isDesktop = vw >= 1024;

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleLogin = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    let valid = true;
    setEmailErr("");
    setPassErr("");
    setServerErr("");

    if (!validateEmail(email)) {
      setEmailErr("Please enter a valid email address.");
      valid = false;
    }
    if (password.length < 6) {
      setPassErr("Password must be at least 6 characters.");
      valid = false;
    }
    if (!valid) {
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err.friendlyMessage ||
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      if (err.response?.status === 401) {
        setPassErr(msg);
        setServerErr(msg);
      } else {
        setServerErr(msg);
      }
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    setForgotMsg("");
    setForgotErr("");
    if (!forgotEmail.trim()) {
      setForgotErr("Email is required.");
      return;
    }
    setForgotLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email: forgotEmail });
      setForgotMsg(data.message || "A reset link has been sent to your email.");
    } catch (err) {
      setForgotErr(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  // CSS animations injection
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800;900&display=swap');
    
    body {
      margin: 0;
      background: #030308;
      overflow-x: hidden;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes glowPulse {
      0%, 100% {
        border-color: rgba(99, 102, 241, 0.25);
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.08);
      }
      50% {
        border-color: rgba(99, 102, 241, 0.45);
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.16);
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      15%, 45%, 75% { transform: translateX(-6px); }
      30%, 60%, 90% { transform: translateX(6px); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 200px;
      }
    }

    .animate-fade-up {
      animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .shake-trigger {
      animation: shake 0.4s ease;
    }

    .spinner-spin {
      animation: spin 0.6s linear infinite;
    }

    /* Sub-pixel gradient border effect */
    .premium-card-border {
      position: relative;
      border-radius: 20px;
      background: rgba(10, 10, 20, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .premium-card-border::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 21px;
      padding: 1.5px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.05) 50%, rgba(139, 92, 246, 0.2) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 1;
    }
  `;

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{css}</style>
      <BlueprintBackground />

      {isDesktop ? (
        /* ── DESKTOP SPLIT VIEW ── */
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", width: "100%", height: "100%", zIndex: 10 }}>
          
          {/* Left Branding Panel */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 80px", position: "relative", overflow: "hidden" }}>
            
            {/* Logo bar */}
            <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: 12, animationDelay: "0.1s" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}>
                <Building size={20} color="#FFF" />
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: "800", letterSpacing: "-1px" }}>
                <span style={{ color: "#FFF" }}>Build</span><span style={{ color: "#818CF8" }}>Track</span>
              </div>
            </div>

            {/* Middle Main Copy */}
            <div style={{ maxWidth: 460 }}>
              <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 20, padding: "6px 12px", marginBottom: 20 }}>
                  <Sparkles size={13} color="#818CF8" />
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#818CF8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Enterprise OS</span>
                </div>
              </div>

              <h1 className="animate-fade-up" style={{ fontFamily: "'Outfit', sans-serif", fontSize: "44px", fontWeight: "900", color: "#FFF", lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-1.5px", animationDelay: "0.3s" }}>
                Build smarter.<br />
                <span style={{ background: "linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Track everything.</span>
              </h1>
              
              <p className="animate-fade-up" style={{ fontSize: "15px", color: "#94A3B8", lineHeight: 1.7, margin: "0 0 36px", animationDelay: "0.4s" }}>
                Connect site budgeting, inventory control, and financial logs on one premium workspace. Elevate your operational margins today.
              </p>

              {/* Floating KPI mock-up widget */}
              <div className="animate-fade-up" style={{ animationDelay: "0.5s" }}>
                <div 
                  style={{ 
                    background: "rgba(15, 15, 25, 0.5)", 
                    border: "1px solid rgba(255,255,255,0.06)", 
                    borderRadius: 18, 
                    padding: 20, 
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>📈</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#E2E8F0" }}>Site Budget Fulfillment</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#10B981" }}>+12.4%</span>
                  </div>

                  <div style={{ color: "#FFF", fontSize: 24, fontWeight: "800", marginBottom: 14 }}>
                    ₹48,24,500 <span style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}>of ₹62,00,000</span>
                  </div>

                  {/* Progress bar container */}
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                    <div 
                      style={{ 
                        height: "100%", 
                        width: `${progressVal}%`, 
                        background: "linear-gradient(90deg, #6366F1 0%, #06B6D4 100%)", 
                        borderRadius: 3,
                        transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
                      }} 
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6B7280", fontWeight: "600" }}>
                    <span>Allocated</span>
                    <span>78% complete</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer indicators */}
            <div className="animate-fade-up" style={{ display: "flex", gap: 32, fontSize: "11.5px", color: "#4B5563", fontWeight: "600", animationDelay: "0.6s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} color="#818CF8" /> ISO 27001 Secure</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} color="#06B6D4" /> Real-time Sync</div>
            </div>

          </div>

          {/* Right Authentication Panel */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
            <div 
              className={`premium-card-border animate-fade-up ${shake ? "shake-trigger" : ""}`}
              style={{
                width: "100%",
                maxWidth: 440,
                padding: "48px 40px",
                backdropFilter: "blur(24px) saturate(120%)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                animationDelay: "0.2s"
              }}
            >
              <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#FFF", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Welcome back</h2>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#6B7280", fontWeight: "500" }}>Enter your credentials to access your workspace.</p>
              </div>

              {/* Server Exception alert */}
              {serverErr && (
                <div 
                  style={{ 
                    background: "rgba(239, 68, 68, 0.08)", 
                    border: "1.2px solid rgba(239, 68, 68, 0.3)", 
                    borderRadius: 12, 
                    padding: "12px 14px", 
                    marginBottom: 20, 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 10,
                    animation: "slideDown 0.25s ease"
                  }}
                >
                  <AlertTriangle size={16} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "12.5px", color: "#FCA5A5", fontWeight: "600", lineHeight: 1.4 }}>{serverErr}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                
                <PremiumInput 
                  type="email"
                  label="Email address"
                  icon={Mail}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailErr("");
                    setServerErr("");
                  }}
                  error={emailErr}
                  autoComplete="email"
                />

                <div style={{ position: "relative" }}>
                  <PremiumInput 
                    type={showPass ? "text" : "password"}
                    label="Password"
                    icon={Lock}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setPassErr("");
                      setServerErr("");
                    }}
                    error={passErr}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 15,
                      background: "none",
                      border: "none",
                      color: "#4B5563",
                      cursor: "pointer",
                      padding: 4,
                      zIndex: 30
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Reset Trigger Link */}
                <div style={{ textAlign: "right", margin: "-10px 0 24px" }}>
                  <span 
                    onClick={() => {
                      setShowForgot(!showForgot);
                      setForgotMsg("");
                      setForgotErr("");
                    }}
                    style={{ fontSize: "12.5px", fontWeight: "700", color: "#818CF8", cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#A5B4FC"}
                    onMouseLeave={e => e.currentTarget.style.color = "#818CF8"}
                  >
                    {showForgot ? "← Back to Sign In" : "Forgot Password?"}
                  </span>
                </div>

                {/* Collapsible Forgot Password panel drawer */}
                {showForgot && (
                  <div 
                    style={{
                      background: "rgba(99, 102, 241, 0.04)",
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                      borderRadius: 14,
                      padding: "18px",
                      marginBottom: 24,
                      animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both"
                    }}
                  >
                    <h4 style={{ margin: "0 0 6px", fontSize: "13.5px", fontWeight: "700", color: "#FFF" }}>Reset Password</h4>
                    <p style={{ margin: "0 0 14px", fontSize: "11.5px", color: "#94A3B8", lineHeight: 1.4 }}>Enter your email address and we will mail you a secure recovery link.</p>
                    
                    <PremiumInput 
                      type="email"
                      label="Recovery Email"
                      icon={Mail}
                      value={forgotEmail}
                      onChange={e => {
                        setForgotEmail(e.target.value);
                        setForgotErr("");
                      }}
                      error={forgotErr}
                    />

                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={handleForgotSubmit}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                        color: "#FFF",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                        opacity: forgotLoading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
                      }}
                    >
                      {forgotLoading && <span className="spinner-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />}
                      {forgotLoading ? "Sending Link..." : "Send Recovery Mail"}
                    </button>

                    {forgotMsg && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: "#34D399", fontSize: "12px", fontWeight: "700" }}>
                        <CheckCircle size={14} />
                        <span>{forgotMsg}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary login button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)",
                    color: "#FFF",
                    fontWeight: "800",
                    fontSize: "13.5px",
                    letterSpacing: "0.06em",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.75 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 8px 24px rgba(99, 102, 241, 0.25)",
                    transition: "transform 0.15s ease"
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(99, 102, 241, 0.4)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {loading && <span className="spinner-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />}
                  {loading ? "AUTHENTICATING..." : "SIGN IN TO WORKSPACE"}
                  {!loading && <ArrowRight size={14} />}
                </button>

              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: "11.5px", color: "#4B5563", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>or secure connect</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${API_ORIGIN}/api/auth/google`;
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "1.2px solid rgba(255, 255, 255, 0.06)",
                  background: "rgba(255,255,255,0.02)",
                  color: "#E2E8F0",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                }}
              >
                <GoogleIcon /> Continue with Google
              </button>

              {/* Signup Link footer */}
              <div style={{ textAlign: "center", marginTop: 28 }}>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>
                  New to BuildTrack?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "#818CF8",
                      fontWeight: "700"
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#A5B4FC"}
                    onMouseLeave={e => e.currentTarget.style.color = "#818CF8"}
                  >
                    Create account free
                  </button>
                </p>

                <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", gap: 10, fontSize: "11px", color: "#4B5563", fontWeight: "600" }}>
                  <span style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"} onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>Privacy Policy</span>
                  <span>·</span>
                  <span style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"} onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>Terms</span>
                  <span>·</span>
                  <span style={{ cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"} onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}>Support</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* ── MOBILE / TABLET VIEW ── */
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", zIndex: 10, padding: "32px 20px", boxSizing: "border-box", overflowY: "auto", justifyContent: "center", alignItems: "center" }}>
          
          <div style={{ width: "100%", maxWidth: 400 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Building size={16} color="#FFF" />
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: "800", letterSpacing: "-0.5px" }}>
                <span style={{ color: "#FFF" }}>Build</span><span style={{ color: "#818CF8" }}>Track</span>
              </div>
            </div>

            <div 
              className={`premium-card-border ${shake ? "shake-trigger" : ""}`}
              style={{
                width: "100%",
                padding: "36px 24px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                boxSizing: "border-box"
              }}
            >
              <div style={{ marginBottom: 26, textAlign: "center" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#FFF", margin: "0 0 4px", letterSpacing: "-0.5px" }}>Welcome back</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>Sign in to your BuildTrack account.</p>
              </div>

              {serverErr && (
                <div 
                  style={{ 
                    background: "rgba(239, 68, 68, 0.08)", 
                    border: "1.2px solid rgba(239, 68, 68, 0.3)", 
                    borderRadius: 12, 
                    padding: "10px 12px", 
                    marginBottom: 20, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8,
                    animation: "slideDown 0.2s ease"
                  }}
                >
                  <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "11.5px", color: "#FCA5A5", fontWeight: "600" }}>{serverErr}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                
                <PremiumInput 
                  type="email"
                  label="Email address"
                  icon={Mail}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailErr("");
                    setServerErr("");
                  }}
                  error={emailErr}
                  autoComplete="email"
                />

                <div style={{ position: "relative" }}>
                  <PremiumInput 
                    type={showPass ? "text" : "password"}
                    label="Password"
                    icon={Lock}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setPassErr("");
                      setServerErr("");
                    }}
                    error={passErr}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 15,
                      background: "none",
                      border: "none",
                      color: "#4B5563",
                      cursor: "pointer",
                      padding: 4,
                      zIndex: 30
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div style={{ textAlign: "right", margin: "-10px 0 24px" }}>
                  <span 
                    onClick={() => {
                      setShowForgot(!showForgot);
                      setForgotMsg("");
                      setForgotErr("");
                    }}
                    style={{ fontSize: "12px", fontWeight: "700", color: "#818CF8", cursor: "pointer" }}
                  >
                    {showForgot ? "← Back to Sign In" : "Forgot Password?"}
                  </span>
                </div>

                {showForgot && (
                  <div 
                    style={{
                      background: "rgba(99, 102, 241, 0.04)",
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                      borderRadius: 14,
                      padding: "16px",
                      marginBottom: 24,
                      animation: "slideDown 0.3s ease both"
                    }}
                  >
                    <h4 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "700", color: "#FFF" }}>Reset Password</h4>
                    <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#94A3B8", lineHeight: 1.4 }}>We'll send a password recovery link to your email.</p>
                    
                    <PremiumInput 
                      type="email"
                      label="Recovery Email"
                      icon={Mail}
                      value={forgotEmail}
                      onChange={e => {
                        setForgotEmail(e.target.value);
                        setForgotErr("");
                      }}
                      error={forgotErr}
                    />

                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={handleForgotSubmit}
                      style={{
                        width: "100%",
                        padding: "11px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                        color: "#FFF",
                        fontWeight: "700",
                        fontSize: "12.5px",
                        cursor: forgotLoading ? "not-allowed" : "pointer",
                        opacity: forgotLoading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8
                      }}
                    >
                      {forgotLoading && <span className="spinner-spin" style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />}
                      {forgotLoading ? "Sending Link..." : "Send Recovery Mail"}
                    </button>

                    {forgotMsg && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: "#34D399", fontSize: "11.5px", fontWeight: "700" }}>
                        <CheckCircle size={13} />
                        <span>{forgotMsg}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)",
                    color: "#FFF",
                    fontWeight: "800",
                    fontSize: "13px",
                    letterSpacing: "0.06em",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.75 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 8px 20px rgba(99, 102, 241, 0.2)"
                  }}
                >
                  {loading && <span className="spinner-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />}
                  {loading ? "AUTHENTICATING..." : "SIGN IN"}
                  {!loading && <ArrowRight size={13} />}
                </button>

              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: "10.5px", color: "#4B5563", fontWeight: "700" }}>OR CONNECT</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `${API_ORIGIN}/api/auth/google`;
                }}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 12,
                  border: "1.2px solid rgba(255, 255, 255, 0.06)",
                  background: "rgba(255,255,255,0.02)",
                  color: "#E2E8F0",
                  fontWeight: "700",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "#6B7280", fontWeight: "500" }}>
                  New to BuildTrack?{" "}
                  <span onClick={() => navigate("/signup")} style={{ color: "#818CF8", fontWeight: "700", cursor: "pointer" }}>Create account</span>
                </p>

                <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", gap: 10, fontSize: "10.5px", color: "#4B5563", fontWeight: "600" }}>
                  <span>Privacy Policy</span>
                  <span>·</span>
                  <span>Terms</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}