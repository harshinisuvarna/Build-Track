const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");
const passport = require("./config/passport");
require("dotenv").config();

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
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

app.listen(5000, () => console.log("🚀 Server → http://localhost:5000"));