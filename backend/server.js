// ⚠️ dotenv MUST be loaded BEFORE passport so env vars are available for OAuth strategy registration
require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");
const passport = require("./config/passport");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// Multi-part Debug Logger — Bug 22: Only in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url} | Content: ${req.headers["content-type"]}`);
    next();
  });
}

app.use(express.json());

// ── Serve uploaded images statically ─────────────────────────────────────────
// Images accessible at: http://localhost:5000/uploads/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Passport (no sessions — JWT only) ────────────────────────────────────────
app.use(passport.initialize());

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/BuildTrack")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => { console.error("❌ MongoDB error:", err.message); process.exit(1); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/authRoutes"));
app.use("/api/workers",      require("./routes/workerRoutes"));
app.use("/api/projects",     require("./routes/projectRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/dashboard",    require("./routes/dashboardRoutes"));
app.use("/api/reports",      require("./routes/reportRoutes"));
app.use("/api/voice",        require("./routes/voiceRoutes"));

// ── Test route (no auth) ──────────────────────────────────────────────────────
app.get("/api/test", (req, res) => res.json({ ok: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "BuildTrack API 🏗️" }));

// ── 404 + global error handler ────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

app.listen(PORT, () => console.log(`🚀 Server → http://localhost:${PORT}`));