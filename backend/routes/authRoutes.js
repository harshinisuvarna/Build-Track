const express = require("express");
const jwt     = require("jsonwebtoken");
const router  = express.Router();
const passport = require("passport");
const User    = require("../models/User");

const SECRET      = process.env.JWT_SECRET || "buildtrack_secret_change_in_prod";
const FRONTEND    = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeToken = (user) =>
  jwt.sign({ id: user._id || user.id, email: user.email }, SECRET, { expiresIn: "7d" });

const safeUser = (user) => ({
  id:        user._id || user.id,
  name:      user.name,
  email:     user.email,
  isActive:  user.isActive,
  createdAt: user.createdAt,
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


module.exports = router;