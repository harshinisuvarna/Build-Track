require("dotenv").config();
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
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
const morgan       = require("morgan");
const passport     = require("./config/passport");
const app = express();
const PORT        = Number(process.env.PORT) || 5000;
const NODE_ENV    = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
const isProd      = NODE_ENV === "production";
app.set("trust proxy", 1);
app.use(helmet());
app.disable("x-powered-by");
app.use(compression());
const productionOrigins = new Set(
  [process.env.FRONTEND_URL, process.env.CLIENT_URL].filter(Boolean)
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isProd) {
        if (productionOrigins.has(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,                  
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests — please try again later." },
});
app.use("/api/", limiter);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(morgan(isProd ? "combined" : "dev"));
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  CLOUDINARY env vars not fully set — image uploads will fail!");
}
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(passport.initialize());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
app.get("/", (_req, res) =>
  res.json({ status: "ok", app: "BuildTrack API 🏗️", env: NODE_ENV })
);
app.use("/api/auth",         require("./routes/authRoutes"));
app.use("/api/workers",      require("./routes/workerRoutes"));
app.use("/api/projects",     require("./routes/projectRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/inventory",    require("./routes/inventoryRoutes"));
app.use("/api/dashboard",    require("./routes/dashboardRoutes"));
app.use("/api/reports",      require("./routes/reportRoutes"));
app.use("/api/voice",        require("./routes/voiceRoutes"));
app.use("/api/project-updates", require("./routes/projectUpdateRoutes"));
app.get("/api/test", (_req, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, _req, res, _next) => {
  if (!isProd) console.error(err.stack);
  else console.error(`[ERROR] ${err.message}`);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large. Maximum size is 5 MB." });
  }
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});
const server = app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} [${NODE_ENV}]`)
);
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
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});