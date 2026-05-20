import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, authAPI } from "../api";
import { Toast, ConfirmDialog } from "../components/Toast";
import { resolveImageUrl } from "../utils/imageUrl";

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle}
      style={{
        width: 48, height: 26, borderRadius: 13, cursor: "pointer",
        background: on ? "#ea580c" : "#d1d5db",
        position: "relative", transition: "background 0.25s ease",
        flexShrink: 0,
      }}>
      <div style={{
        position: "absolute", top: 3,
        left: on ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.25s ease",
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const profileInputRef = useRef(null);

  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);
  const [profileImage, setProfileImage] = useState(null);
  const [fullName,     setFullName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [role,         setRole]         = useState("Site Supervisor");
  const [language,     setLanguage]     = useState("English");
  const [currency,     setCurrency]     = useState("Indian Rupee (INR)");
  const [emailNotif,   setEmailNotif]   = useState(true);
  const [pushNotif,    setPushNotif]    = useState(false);
  const [twoFA,        setTwoFA]        = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [secMsg,       setSecMsg]       = useState("");
  const [secErr,       setSecErr]       = useState("");
  const [showPwForm,   setShowPwForm]   = useState(false);
  const [curPw,        setCurPw]        = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [pwSaving,     setPwSaving]     = useState(false);

  const [toast,        setToast]        = useState({ msg: "", type: "info" });
  const [confirmDlg,   setConfirmDlg]   = useState(null);
  const navigate = useNavigate();
  const clearToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  useEffect(() => {
    const stored = localStorage.getItem("bt_user");
    if (stored) {
      const u = JSON.parse(stored);
      setFullName(u.name || "");
      setEmail(u.email || "");
      setRole(u.role || "Site Supervisor");
      if (u.twoFactorEnabled !== undefined) {
        setTwoFA(u.twoFactorEnabled);
      }
      if (u.profilePhoto) {
        setProfileImage(resolveImageUrl(u.profilePhoto));
      }
    }
    authAPI.me()
      .then(({ data }) => {
        const user = data.user || data;
        if (user.twoFactorEnabled !== undefined) {
          setTwoFA(user.twoFactorEnabled);
        }
        const cached = JSON.parse(localStorage.getItem("bt_user") || "{}");
        localStorage.setItem("bt_user", JSON.stringify({ ...cached, ...user }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileImage(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await userAPI.updatePhoto(fd);

      const stored = JSON.parse(localStorage.getItem("bt_user") || "{}");
      localStorage.setItem("bt_user", JSON.stringify({
        ...stored,
        profilePhoto: data.profilePhoto,
      }));

      window.dispatchEvent(new Event("userUpdated"));
    } catch {
      setToast({ msg: "Failed to upload photo.", type: "error" });
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !email.trim()) {
      setToast({ msg: "Name and email cannot be empty.", type: "error" });
      return;
    }
    try {
      setSaving(true);
      const { data } = await userAPI.updateProfile({
        name: fullName,
        email,
        role,
      });

      const stored = JSON.parse(localStorage.getItem("bt_user") || "{}");
      localStorage.setItem("bt_user", JSON.stringify({ ...stored, ...data.user }));

      window.dispatchEvent(new Event("userUpdated"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed to save profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };


  const handleChangePassword = async () => {
    setSecErr(""); setSecMsg("");
    if (!curPw || !newPw) { setSecErr("Both fields are required."); return; }
    if (newPw.length < 6) { setSecErr("New password must be at least 6 characters."); return; }
    try {
      setPwSaving(true);
      const { data } = await authAPI.changePassword({ currentPassword: curPw, newPassword: newPw });
      setSecMsg(data.message || "Password changed successfully!");
      setCurPw(""); setNewPw(""); setShowPwForm(false);
      setTimeout(() => setSecMsg(""), 4000);
    } catch (err) {
      setSecErr(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };


  const handleToggle2FA = async () => {
    try {
      const { data } = await authAPI.toggle2FA();
      setTwoFA(data.twoFactorEnabled);
      setSecMsg(data.message);

      const cached = JSON.parse(localStorage.getItem("bt_user") || "{}");
      localStorage.setItem("bt_user", JSON.stringify({ ...cached, twoFactorEnabled: data.twoFactorEnabled }));
      setTimeout(() => setSecMsg(""), 4000);
    } catch (err) {
      setSecErr(err.response?.data?.message || "Failed to toggle 2FA.");
    }
  };


  const handleSignOutAll = () => {
    setConfirmDlg({
      message: "Sign out from all devices? You will need to log in again.",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await authAPI.signOutAll();
          localStorage.removeItem("bt_token");
          localStorage.removeItem("bt_user");
          navigate("/login");
        } catch (err) {
          setSecErr(err.response?.data?.message || "Failed to sign out all sessions.");
        }
      },
    });
  };


  const handleDeleteAccount = () => {
    setConfirmDlg({
      message: "Are you sure you want to permanently delete your account? This action cannot be undone.",
      danger: true,
      confirmLabel: "Delete My Account",
      onConfirm: async () => {
        setConfirmDlg(null);
        try {
          await authAPI.deleteAccount();
          localStorage.removeItem("bt_token");
          localStorage.removeItem("bt_user");
          navigate("/login");
        } catch (err) {
          setSecErr(err.response?.data?.message || "Failed to delete account.");
        }
      },
    });
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "#f9f9f9", border: "1px solid #e5e5e5",
    borderRadius: 10, fontSize: 14, color: "#1a1a1a",
    outline: "none", fontFamily: "'Segoe UI', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: "#aaa",
    letterSpacing: "0.06em", marginBottom: 8, display: "block",
  };

  const sectionCard = {
    background: "#fff", borderRadius: 16,
    border: "1px solid #ebebeb", padding: "28px 32px",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 20,
  };

  const sectionTitle = {
    fontSize: 18, fontWeight: 700, color: "#1a1a1a",
    marginBottom: 24,
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: "100%", minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif", background: "#f7f7f8",
    }}>
      {/* Toast + Confirm Dialog */}
      <Toast message={toast.msg} type={toast.type} onClose={clearToast} />
      {confirmDlg && (
        <ConfirmDialog
          message={confirmDlg.message}
          danger={confirmDlg.danger}
          confirmLabel={confirmDlg.confirmLabel}
          onConfirm={confirmDlg.onConfirm}
          onCancel={() => setConfirmDlg(null)}
        />
      )}

      {/* Top Bar */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #ebebeb",
        padding: "16px 24px", display: "flex", alignItems: "center",
        gap: 12, flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1a1a1a" }}>Settings</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Manage your account preferences and security</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          {/* ── Profile Settings ── */}
          <div style={sectionCard}>
            <div style={sectionTitle}>Profile Settings</div>

            <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: isMobile ? "wrap" : "nowrap" }}>

              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "#f0e6d3", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 40, border: "3px solid #f0f0f0",
                }}>
                  {profileImage
                    ? <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : "👷"
                  }
                </div>
                <div
                  onClick={() => profileInputRef.current.click()}
                  style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#ea580c", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 12, cursor: "pointer", border: "2px solid #fff",
                  }}>✏️</div>
              </div>

              {/* Fields */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>FULL NAME</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL ADDRESS</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>ROLE</label>
                  <input value={role} onChange={e => setRole(e.target.value)}
                    style={{ ...inputStyle, maxWidth: isMobile ? "100%" : "calc(50% - 8px)" }} />
                </div>

                {/* ── Edit Profile button — turns green on save ── */}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    padding: "11px 24px",
                    background: saved ? "#16a34a" : "#ea580c",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saved
                      ? "0 4px 12px rgba(22,163,74,0.3)"
                      : "0 4px 12px rgba(234,88,12,0.3)",
                    transition: "background 0.3s ease, box-shadow 0.3s ease",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving…" : saved ? "✓ Profile Saved!" : "Edit Profile Details"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Preferences ── */}
          <div style={sectionCard}>
            <div style={sectionTitle}>Preferences</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ ...labelStyle, fontSize: 13, color: "#444", fontWeight: 500, letterSpacing: 0 }}>Display Language</label>
                <div style={{ position: "relative" }}>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer", paddingRight: 36 }}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                    <option>Tamil</option>
                  </select>
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none", fontSize: 12 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: 13, color: "#444", fontWeight: 500, letterSpacing: 0 }}>Currency Indicator</label>
                <div style={{ display: "flex", alignItems: "center", background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", gap: 10 }}>
                  <span style={{ fontSize: 16, color: "#ea580c", fontWeight: 700 }}>₹</span>
                  <span style={{ fontSize: 14, color: "#1a1a1a" }}>{currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notifications ── */}
          <div style={sectionCard}>
            <div style={sectionTitle}>Notifications</div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Email Notifications</div>
                <div style={{ fontSize: 13, color: "#888" }}>Receive daily reports and project updates via email</div>
              </div>
              <Toggle on={emailNotif} onToggle={() => setEmailNotif(v => !v)} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Push Notifications</div>
                <div style={{ fontSize: 13, color: "#888" }}>Alerts for site issues and worker attendance</div>
              </div>
              <Toggle on={pushNotif} onToggle={() => setPushNotif(v => !v)} />
            </div>
          </div>

          {/* ── Security ── */}
          <div style={sectionCard}>
            <div style={sectionTitle}>Security</div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Account Password</div>
                <div style={{ fontSize: 13, color: "#888" }}>Manage your account password</div>
              </div>
              <button
                onClick={() => setShowPwForm(v => !v)}
                style={{
                  padding: "10px 18px", background: "#fff",
                  border: "1px solid #e5e5e5", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#444", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                🔒 {showPwForm ? "Cancel" : "Change Password"}
              </button>
            </div>

            {/* Inline password change form */}
            {showPwForm && (
              <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 6, display: "block" }}>Current Password</label>
                    <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                      placeholder="Enter current password" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 6, display: "block" }}>New Password</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                      placeholder="Enter new password (min 6 chars)" style={inputStyle} />
                  </div>
                </div>
                <button onClick={handleChangePassword} disabled={pwSaving}
                  style={{ padding: "10px 24px", background: "#ea580c", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: pwSaving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(234,88,12,0.25)" }}>
                  {pwSaving ? "Saving…" : "Update Password"}
                </button>
              </div>
            )}

            {/* Security status messages */}
            {secMsg && (
              <div style={{ padding: "12px 16px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, color: "#166534", fontSize: 13, margin: "12px 0" }}>
                ✅ {secMsg}
              </div>
            )}
            {secErr && (
              <div style={{ padding: "12px 16px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, color: "#991b1b", fontSize: 13, margin: "12px 0" }}>
                ⚠️ {secErr}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 13, color: "#888" }}>Add an extra layer of security to your account</div>
              </div>
              <button
                onClick={handleToggle2FA}
                style={{
                  padding: "10px 18px",
                  background: twoFA ? "#fff" : "#ea580c",
                  border: twoFA ? "1px solid #e5e5e5" : "none",
                  borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: twoFA ? "#444" : "#fff",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: twoFA ? "none" : "0 4px 12px rgba(234,88,12,0.25)",
                  transition: "all 0.25s ease",
                }}
              >
                🛡️ {twoFA ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Active Sessions</div>
                <div style={{ fontSize: 13, color: "#888" }}>2 devices currently logged in</div>
              </div>
              <button
                onClick={handleSignOutAll}
                style={{
                  padding: "10px 18px", background: "#fff",
                  border: "1px solid #e5e5e5", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#dc2626",
                }}
              >
                Sign Out All
              </button>
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div style={{ ...sectionCard, border: "1px solid #fee2e2", background: "#fff" }}>
            <div style={{ ...sectionTitle, color: "#dc2626" }}>Danger Zone</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Delete Account</div>
                <div style={{ fontSize: 13, color: "#888" }}>Permanently delete your account and all associated data. This action cannot be undone.</div>
              </div>
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: "10px 20px", background: "#fff",
                  border: "1.5px solid #dc2626", borderRadius: 10,
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  color: "#dc2626", whiteSpace: "nowrap",
                }}
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}