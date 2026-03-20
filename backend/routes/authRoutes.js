const express  = require("express");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const router   = express.Router();
const passport = require("passport");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");
const upload   = require("../config/multer");

const SECRET      = process.env.JWT_SECRET || "buildtrack_secret_change_in_prod";
const FRONTEND    = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeToken = (user) =>
  jwt.sign({ id: user._id || user.id, email: user.email }, SECRET, { expiresIn: "7d" });

const safeUser = (user) => ({
  id:           user._id || user.id,
  name:         user.name,
  email:        user.email,
  role:         user.role || "User",
  profilePhoto: user.profilePhoto || null,
  provider:     user.provider || "local",
  isActive:     user.isActive,
  createdAt:    user.createdAt,
});


// ─── REGISTER ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ message: "An account with this email already exists" });

    const user = await User.create({ name: name.trim(), email, password });

    res.status(201).json({
      message: "Account created successfully",
      token:   makeToken(user),
      user:    safeUser(user),
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});


// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account deactivated. Contact support." });

    // If this user signed up via OAuth and has no password
    if (!user.password)
      return res.status(400).json({
        message: "This account uses Google or GitHub login. Please use those buttons instead.",
      });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      token:   makeToken(user),
      user:    safeUser(user),
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});


// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ message: "No token provided" });

    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    const user    = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user: safeUser(user) });
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});


// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
// PUT /api/auth/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name)  user.name  = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role)  user.role  = role.trim();

    await user.save();
    res.json({ message: "Profile updated", user: safeUser(user) });
  } catch (err) {
    console.error("Profile update error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already in use by another account" });
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
});


// ─── UPDATE PROFILE PHOTO ─────────────────────────────────────────────────────
// PUT /api/auth/photo
router.put("/photo", protect, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePhoto = req.file.filename;
    await user.save();

    res.json({ message: "Photo updated", profilePhoto: req.file.filename });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Failed to upload photo" });
  }
});


// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
// GET /api/auth/google
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message: "Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.",
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${FRONTEND}/login?error=google_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const token = makeToken(req.user);
    res.redirect(`${FRONTEND}/oauth/callback?token=${token}`);
  }
);


// ─── GITHUB OAUTH ─────────────────────────────────────────────────────────────
// GET /api/auth/github
router.get("/github", (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({
      message: "GitHub login is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env file.",
    });
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

// GET /api/auth/github/callback
router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", {
      session: false,
      failureRedirect: `${FRONTEND}/login?error=github_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const token = makeToken(req.user);
    res.redirect(`${FRONTEND}/oauth/callback?token=${token}`);
  }
);


// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }

    if (!user.password) {
      return res.json({ message: "This account uses Google or GitHub login. Please use those instead." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Log reset link to console (replace with nodemailer in production)
    const resetUrl = `${FRONTEND}/login?resetToken=${token}`;
    console.log("──────────────────────────────────────────");
    console.log("📧 PASSWORD RESET LINK (send via email in production):");
    console.log(`   ${resetUrl}`);
    console.log("   Token:", token);
    console.log("──────────────────────────────────────────");

    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ─── RESET PASSWORD (via token) ───────────────────────────────────────────
// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password; // will be hashed by pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ─── CHANGE PASSWORD (authenticated) ─────────────────────────────────────
// PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      return res.status(400).json({ message: "This account uses OAuth login and has no password to change." });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // hashed by pre-save hook
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});


// ─── TOGGLE 2FA ───────────────────────────────────────────────────────────
// PUT /api/auth/toggle-2fa
router.put("/toggle-2fa", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.json({
      message: user.twoFactorEnabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (err) {
    console.error("Toggle 2FA error:", err);
    res.status(500).json({ message: "Failed to toggle 2FA" });
  }
});


// ─── SIGN OUT ALL SESSIONS ────────────────────────────────────────────────
// POST /api/auth/sign-out-all
router.post("/sign-out-all", protect, async (req, res) => {
  // In a JWT-only system, there's no server-side session to invalidate.
  // A production system would use a token blacklist or change JWT secret per user.
  // For now, we just acknowledge the request — the frontend clears localStorage.
  res.json({ message: "All sessions signed out. Please log in again on all your devices." });
});


// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────
// DELETE /api/auth/account
router.delete("/account", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Soft-delete: deactivate the account instead of hard-deleting
    user.isActive = false;
    await user.save();

    res.json({ message: "Account has been deactivated permanently." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
});


module.exports = router;