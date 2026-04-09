// ⚠️ dotenv MUST be loaded FIRST — before any other imports that read env vars
require("dotenv").config();

// ── Fail fast: critical env vars required at startup ─────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Add them to your .env file and restart the server.");
  process.exit(1);
}

const express      = require("express");
const mongoose     = require("mongoose");
const cors         = require("cors");
const path         = require("path");
const helmet       = require("helmet");
const compression  = require("compression");
const rateLimit    = require("express-rate-limit");
const passport     = require("./config/passport");

const app = express();

// ── Config ────────────────────────────────────────────────────────────────────
const PORT        = Number(process.env.PORT) || 5000;
const NODE_ENV    = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
const isProd      = NODE_ENV === "production";

// ── Trust proxy (required for Render / Railway / etc.) ───────────────────────
app.set("trust proxy", 1);

// ── Security: Helmet (sets secure HTTP headers) ───────────────────────────────
app.use(helmet());
app.disable("x-powered-by"); // belt-and-suspenders — helmet already does this

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production only FRONTEND_URL is allowed.
// In development any localhost/127.0.0.1 port is accepted automatically.
const productionOrigins = new Set(
  [process.env.FRONTEND_URL, process.env.CLIENT_URL].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (Postman, curl — no Origin header)
      if (!origin) return callback(null, true);
      if (isProd) {
        // Production: only the configured frontend URL is allowed
        if (productionOrigins.has(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }
      // Development: any localhost/127.0.0.1 port is fine
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      if (productionOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests — please try again later." },
});
app.use("/api/", limiter);

// ── Body parsers (with size limits) ──────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Request logger (development only) ────────────────────────────────────────
if (!isProd) {
  app.use((req, _res, next) => {
    console.log(`[REQ] ${req.method} ${req.url} | Content-Type: ${req.headers["content-type"] || "—"}`);
    next();
  });
}

// ── Static: serve uploaded files ──────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Passport (no sessions — JWT only) ────────────────────────────────────────
app.use(passport.initialize());

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", app: "BuildTrack API 🏗️", env: NODE_ENV })
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/authRoutes"));
app.use("/api/workers",      require("./routes/workerRoutes"));
app.use("/api/projects",     require("./routes/projectRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/dashboard",    require("./routes/dashboardRoutes"));
app.use("/api/reports",      require("./routes/reportRoutes"));
app.use("/api/voice",        require("./routes/voiceRoutes"));

// ── Test route (no auth — useful for uptime monitors) ────────────────────────
app.get("/api/test", (_req, res) => res.json({ ok: true }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (!isProd) console.error(err.stack);
  else console.error(`[ERROR] ${err.message}`);

  // Handle multer file-size errors gracefully
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large. Maximum size is 10 MB." });
  }

  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} [${NODE_ENV}]`)
);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n⏳ ${signal} received — shutting down gracefully…`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log("🛑 MongoDB connection closed. Bye!");
      process.exit(0);
    });
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));