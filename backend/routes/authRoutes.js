const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const passport = require("passport");
const mongoose = require("mongoose");

const router = express.Router();

const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../config/multer");
const { getFileUrl } = require("../config/fileHelpers");

const SECRET = process.env.JWT_SECRET;
const FRONTEND =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5173";

const ALLOWED_ROLES = ["Admin", "Supervisor", "Mason"];

const makeToken = (user) =>
  jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    },
    SECRET,
    { expiresIn: "7d" }
  );

const safeUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role || "Mason",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  projectId: user.projectId || null,
  profilePhoto: user.profilePhoto || null,
  provider: user.provider || "local",
  isActive: user.isActive,
  twoFactorEnabled: !!user.twoFactorEnabled,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(permissions.map((p) => String(p).trim()).filter(Boolean))];
};

const toObjectIdOrNull = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

// ✅ AFTER — keeps custom role names, only falls back if empty
const normalizeRole = (role, fallback = "Mason") => {
  const clean = String(role || "").trim();
  return clean.length > 0 ? clean : fallback;
};

const getUserId = (req) => req.user?._id || req.user?.id;

// Public register: used by Create Workspace screen to create first admin account
router.post("/register", async (req, res) => {
  try {
<<<<<<< HEAD
    const { name, email, password, role, permissions, projectId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    const userCount = await User.countDocuments();

    const finalRole =
      userCount === 0 ? "Admin" : normalizeRole(role, "Mason");

    const finalPermissions =
      userCount === 0
        ? [
            "view_projects",
            "add_entries",
            "approve_payments",
            "mark_paid",
            "view_reports",
            "manage_team",
          ]
        : normalizePermissions(permissions);

    const finalProjectId = toObjectIdOrNull(projectId);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      role: finalRole,
      permissions: finalPermissions,
      projectId: finalProjectId,
    });

    return res.status(201).json({
=======
    const { name, email, password, role } = req.body;
    console.log(`[Auth] Register request received for email: ${email}`);
    
    if (!name || !email || !password) {
      console.warn(`[Auth] Registration failed: Missing required fields`);
      return res.status(400).json({ success: false, message: "All fields required" });
    }
    if (password.length < 6) {
      console.warn(`[Auth] Registration failed: Password too short`);
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      console.warn(`[Auth] Registration failed: Email ${email} already exists`);
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }
    const user = await User.create({ name: name.trim(), email, password, role: role || 'Mason' });
    console.log(`[Auth] User registered successfully: ${user._id}`);
    res.status(201).json({
      success: true,
>>>>>>> origin
      message: "Account created successfully",
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (err) {
<<<<<<< HEAD
    console.error("Register error:", err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    return res.status(500).json({ message: "Server error during registration" });
=======
    console.error("[Auth] Register error:", err.message);
    res.status(500).json({ success: false, message: "Server error during registration" });
>>>>>>> origin
  }
});

// Admin-only user provisioning
router.post("/provision", protect, authorize("Admin"), async (req, res) => {
  try {
    const {
      name,
      email,
      temporaryPassword,
      password,
      role,
      permissions,
      projectId,
    } = req.body;

    const finalPassword = temporaryPassword || password;

    if (!name || !email || !finalPassword || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (String(finalPassword).length < 6) {
      return res
        .status(400)
        .json({ message: "Temporary password must be at least 6 characters" });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();
    const cleanRole = normalizeRole(role, "Mason");

    // ✅ REPLACE WITH — only block Admin provisioning (security)
    if (cleanRole.toLowerCase() === "admin") {
      return res.status(400).json({ message: "Cannot provision another Admin account" });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: finalPassword,
      role: cleanRole,
      permissions: normalizePermissions(permissions),
      projectId: toObjectIdOrNull(projectId),
    });

    return res.status(201).json({
      message: "Account provisioned successfully",
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Provisioning error:", err);

    if (err.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }

    return res
      .status(500)
      .json({ message: "Server error during account provisioning" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth] Login request received for email: ${email}`);

    if (!email || !password) {
      console.warn(`[Auth] Login failed: Missing email or password`);
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!user) {
      console.warn(`[Auth] Login failed: User not found for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      console.warn(`[Auth] Login failed: Account deactivated for ${email}`);
      return res.status(403).json({
        success: false,
        message: "Account deactivated. Contact support.",
      });
    }

    if (!user.password) {
      console.warn(`[Auth] Login failed: Social auth only user ${email}`);
      return res.status(400).json({
        success: false,
        message: "This account uses Google or GitHub login. Please use those methods.",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.warn(`[Auth] Login failed: Password mismatch for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = makeToken(user);

    if (!token) {
      console.error(`[Auth] Token generation failed for ${email}`);
      return res.status(500).json({
        success: false,
        message: "Failed to generate authentication token",
      });
    }

<<<<<<< HEAD
=======
    // ✅ RESPONSE (Flutter expects token like this)
    console.log(`[Auth] Login successful for user: ${user._id}`);
>>>>>>> origin
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("[Auth] Login error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

router.get("/me", protect, (req, res) => {
  return res.json({ user: safeUser(req.user) });
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = String(name).trim();
    if (email) user.email = String(email).trim().toLowerCase();

    if (role && req.user.role === "Admin") {
      user.role = normalizeRole(role, user.role);
    }

    await user.save();

    return res.json({ message: "Profile updated", user: safeUser(user) });
  } catch (err) {
    console.error("Profile update error:", err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Email already in use by another account" });
    }

    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.put("/photo", protect, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" });
    }

    const user = await User.findById(getUserId(req));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePhoto = getFileUrl(req.file);
    await user.save();

    return res.json({
      message: "Photo updated",
      profilePhoto: user.profilePhoto,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Photo upload error:", err);
    return res.status(500).json({ message: "Failed to upload photo" });
  }
});

router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      message:
        "Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.",
    });
  }

  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
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
    return res.redirect(`${FRONTEND}/oauth/callback?token=${token}`);
  }
);

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!user) {
      return res.json({
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    if (!user.password) {
      return res.json({
        message:
          "This account uses Google or GitHub login. Please use those instead.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${FRONTEND}/login?resetToken=${token}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
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

        if (process.env.NODE_ENV !== "production") {
          console.log(`Password reset email sent to ${user.email}`);
        }
      } catch (mailErr) {
        console.error("Failed to send reset email:", mailErr.message);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.log("──────────────────────────────────────────");
      console.log(
        "PASSWORD RESET LINK (configure SMTP_HOST/USER/PASS to send via email):"
      );
      console.log(`   ${resetUrl}`);
      console.log("──────────────────────────────────────────");
    }

    return res.json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }

    if (String(newPassword).length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(getUserId(req));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account uses OAuth login and has no password to change.",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

router.put("/toggle-2fa", protect, async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    return res.json({
      message: user.twoFactorEnabled
        ? "Two-factor authentication enabled"
        : "Two-factor authentication disabled",
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (err) {
    console.error("Toggle 2FA error:", err);
    return res.status(500).json({ message: "Failed to toggle 2FA" });
  }
});

router.post("/sign-out-all", protect, async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.json({
      message: "All sessions signed out. Please log in again on all your devices.",
    });
  } catch (err) {
    console.error("Sign out all error:", err);
    return res.status(500).json({ message: "Failed to sign out all sessions" });
  }
});

router.delete("/account", protect, async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;
    await user.save();

    return res.json({ message: "Account has been deactivated permanently." });
  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

module.exports = router;