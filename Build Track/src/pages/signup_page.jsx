import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { 
  User,
  Mail, 
  Lock, 
  Shield,
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import LightPremiumInput from "../components/ui/LightPremiumInput";

const features = [
  { title: "Real-time dashboards",  desc: "Track every project metric live."  },
  { title: "Worker management",     desc: "Manage teams across all sites."    },
  { title: "Financial reporting",   desc: "Budgets, wages & profit margins."  },
  { title: "Site tracking",         desc: "Monitor progress on every site."   },
];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [vw, setVw] = useState(window.innerWidth);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  // Toggles for password visibility
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Errors state
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState("");

  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = vw >= 1024;
  const isMobile = vw < 640;

  const validate = () => {
    const e = {};
    if (!fullName.trim())                           e.name = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid company email.";
    if (password.length < 6)                        e.password = "Min 6 characters required.";
    if (confirm !== password)                       e.confirm = "Passwords do not match.";
    if (!agreed)                                    e.agreed = "Please accept the terms.";
    return e;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const eErrors = validate();
    if (Object.keys(eErrors).length) {
      setErrors(eErrors);
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }
    
    setErrors({});
    setServerErr("");
    setLoading(true);

    try {
      const { data } = await authAPI.register({
        name: fullName.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem("bt_token", data.token);
      localStorage.setItem("bt_user", JSON.stringify(data.user));
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err.friendlyMessage ||
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setServerErr(msg);
      setShake(true);
      setTimeout(() => setShake(false), 420);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        width: "100vw", 
        height: "100vh", 
        overflow: "hidden", 
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(135deg, #C7D2FE 0%, #EDE9FE 50%, #BAE6FD 100%)",
        boxSizing: "border-box"
      }}
    >
      {/* Background Depth Layers */}
      <div className="light-blueprint-grid" />
      <div className="light-glow-1" />
      <div className="light-glow-2" />
      <div className="light-glow-center" />

      {/* Main Centered Hero Layout Container */}
      <div 
        style={{ 
          width: "100%", 
          maxWidth: "1280px", 
          margin: "0 auto", 
          padding: isDesktop ? "0 80px" : "0 24px", 
          boxSizing: "border-box", 
          display: "grid", 
          gridTemplateColumns: isDesktop ? "1.15fr 0.85fr" : "1fr", 
          gap: isDesktop ? "96px" : "32px", 
          alignItems: "center", 
          zIndex: 10,
          position: "relative"
        }}
      >
        
        {/* Left Branding / Marketing Section */}
        {isDesktop && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            
            {/* Logo */}
            <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: 10, animationDelay: "0.1s" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)" }}>
                <Building size={19} color="#FFF" />
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 23, fontWeight: "800", letterSpacing: "-0.5px" }}>
                <span style={{ color: "#1F2937" }}>Build</span><span style={{ color: "#4F46E5" }}>Track</span>
              </div>
            </div>

            {/* Headline and descriptions */}
            <div style={{ marginTop: 36 }}>
              <h1 className="animate-fade-up" style={{ fontFamily: "'Outfit', sans-serif", fontSize: "44px", fontWeight: "900", color: "#1F2937", lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-1.5px", animationDelay: "0.2s" }}>
                Build smarter.<br />
                <span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Track everything.</span>
              </h1>
              
              <p className="animate-fade-up" style={{ fontSize: "16px", color: "#6F7C8F", lineHeight: 1.7, margin: "0 0 44px", animationDelay: "0.3s" }}>
                From site management to financial reporting — everything your construction team needs, in one place.
              </p>

              {/* Checklist */}
              <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px", animationDelay: "0.4s" }}>
                {features.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", flexShrink: 0, marginTop: "2px" }}>
                      <CheckCircle size={12} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "700", color: "#1F2937" }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: "13px", color: "#8E9AA8", lineHeight: 1.45 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* Right Authentication Panel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div 
            className={`animate-fade-up ${shake ? "shake-trigger" : ""}`}
            style={{
              width: "100%",
              maxWidth: 440,
              padding: "44px 40px",
              background: "#FFFFFF",
              borderRadius: 24,
              border: "1px solid #EAEAEF",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.03)",
              animationDelay: "0.15s",
              boxSizing: "border-box",
              position: "relative",
              zIndex: 20
            }}
          >
            
            {/* Mobile Branding */}
            {!isDesktop && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building size={16} color="#FFF" />
                </div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: "800", letterSpacing: "-0.5px" }}>
                  <span style={{ color: "#1F2937" }}>Build</span><span style={{ color: "#4F46E5" }}>Track</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 32, textAlign: isDesktop ? "left" : "center" }}>
              <h2 style={{ fontSize: "23px", fontWeight: "800", color: "#1F2937", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Create your account</h2>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#8E9AA8", fontWeight: "500" }}>Start your 14-day free trial. No credit card required.</p>
            </div>

            {serverErr && (
              <div 
                style={{ 
                  background: "#FEF2F2", 
                  border: "1.2px solid #FCA5A5", 
                  borderRadius: 12, 
                  padding: "12px 14px", 
                  marginBottom: 22, 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: 10,
                  animation: "slideDown 0.2s ease"
                }}
              >
                <AlertTriangle size={16} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: "12.5px", color: "#B91C1C", fontWeight: "600", lineHeight: 1.45 }}>{serverErr}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              <LightPremiumInput 
                type="text"
                label="Full Name"
                icon={User}
                value={fullName}
                onChange={e => {
                  setFullName(e.target.value);
                  setErrors(p => ({...p, name: ""}));
                  setServerErr("");
                }}
                error={errors.name}
                autoComplete="name"
              />

              <LightPremiumInput 
                type="email"
                label="Company Email"
                icon={Mail}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setErrors(p => ({...p, email: ""}));
                  setServerErr("");
                }}
                error={errors.email}
                autoComplete="email"
              />

              <div style={{ position: "relative" }}>
                <LightPremiumInput 
                  type={showPass ? "text" : "password"}
                  label="Password"
                  icon={Lock}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrors(p => ({...p, password: ""}));
                    setServerErr("");
                  }}
                  error={errors.password}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 17,
                    background: "none",
                    border: "none",
                    color: "#8E9AA8",
                    cursor: "pointer",
                    padding: 4,
                    zIndex: 30
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <LightPremiumInput 
                  type={showConfirm ? "text" : "password"}
                  label="Confirm Password"
                  icon={Shield}
                  value={confirm}
                  onChange={e => {
                    setConfirm(e.target.value);
                    setErrors(p => ({...p, confirm: ""}));
                    setServerErr("");
                  }}
                  error={errors.confirm}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 17,
                    background: "none",
                    border: "none",
                    color: "#8E9AA8",
                    cursor: "pointer",
                    padding: 4,
                    zIndex: 30
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Terms checkbox */}
              <div style={{ marginBottom: 24, marginTop: 10 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <div
                    onClick={() => { setAgreed(v => !v); setErrors(p => ({...p, agreed: ""})); }}
                    style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
                      border: `2px solid ${errors.agreed ? "#dc2626" : agreed ? "#6366F1" : "#d0d0d0"}`,
                      background: agreed ? "#6366F1" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s", cursor: "pointer",
                    }}>
                    {agreed && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: "13px", color: "#71717A", lineHeight: 1.6, fontWeight: "500" }}>
                    By creating an account, you agree to our{" "}
                    <span style={{ color: "#6366F1", fontWeight: "700", cursor: "pointer" }}>Terms</span>
                    {" "}and{" "}
                    <span style={{ color: "#6366F1", fontWeight: "700", cursor: "pointer" }}>Privacy Policy</span>.
                  </span>
                </label>
                {errors.agreed && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, color: "#dc2626", fontSize: "11px", fontWeight: "700" }}>
                    <AlertTriangle size={11} />
                    <span>{errors.agreed}</span>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                  color: "#FFF",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  letterSpacing: "0.05em",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.18)",
                }}
              >
                {loading && <span className="spinner-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%" }} />}
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                {!loading && <ArrowRight size={14} />}
              </button>

            </form>

            {/* Login Link */}
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#8E9AA8", fontWeight: "500" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="login-link-btn"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#4F46E5",
                    fontWeight: "700"
                  }}
                >
                  Log in
                </button>
              </p>

              <div className="login-footer-links" style={{ display: "flex", justifyItems: "center", justifyContent: "center", gap: 12, fontSize: "11px", color: "#8E9AA8", fontWeight: "600" }}>
                <span className="login-footer-link">Privacy Policy</span>
                <span>·</span>
                <span className="login-footer-link">Terms</span>
                <span>·</span>
                <span className="login-footer-link">Support</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}