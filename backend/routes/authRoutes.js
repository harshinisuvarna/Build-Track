const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const upload = require("../config/multer");
const { getFileUrl } = require("../config/fileHelpers");
const SECRET = process.env.JWT_SECRET;
const FRONTEND = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
const makeToken = (user) =>
  jwt.sign(
    { id: user._id || user.id, email: user.email, tokenVersion: user.tokenVersion || 0 },
    SECRET,
    { expiresIn: "7d" }
  );
const safeUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role || "User",
  profilePhoto: user.profilePhoto || null,
  provider: user.provider || "local",
  isActive: user.isActive,
  createdAt: user.createdAt,
});
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
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});
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
    if (!user.password)
      return res.status(400).json({
        message: "This account uses Google or GitHub login. Please use those buttons instead.",
      });
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });
    res.json({
      message: "Login successful",
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});
router.get("/me", protect, (req, res) => {
  res.json({ user: safeUser(req.user) });
});
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role.trim();
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
router.put("/photo", protect, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.profilePhoto = getFileUrl(req.file);
    await user.save();
    res.json({ message: "Photo updated", profilePhoto: user.profilePhoto });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Failed to upload photo" });
  }
});
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message: "Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.",
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
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
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }
    if (!user.password) {
      return res.json({ message: "This account uses Google or GitHub login. Please use those instead." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    const resetUrl = `${FRONTEND}/login?resetToken=${token}`;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"BuildTrack" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: "BuildTrack — Password Reset",
          html: [
            `<h2>Password Reset Request</h2>`,
            `<p>Click the link below to reset your password (valid for 1 hour):</p>`,
            `<a href="${resetUrl}">${resetUrl}</a>`,
            `<p>If you didn't request this, you can safely ignore this email.</p>`,
          ].join(""),
        });
        if (process.env.NODE_ENV !== "production") console.log(`📧 Password reset email sent to ${user.email}`);
      } catch (mailErr) {
        console.error("📧 Failed to send reset email:", mailErr.message);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.log("──────────────────────────────────────────");
      console.log("📧 PASSWORD RESET LINK (configure SMTP_HOST/USER/PASS to send via email):");
      console.log(`   ${resetUrl}`);
      console.log("──────────────────────────────────────────");
    }
    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
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
router.post("/sign-out-all", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ message: "All sessions signed out. Please log in again on all your devices." });
  } catch (err) {
    console.error("Sign out all error:", err);
    res.status(500).json({ message: "Failed to sign out all sessions" });
  }
});
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