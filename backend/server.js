require("dotenv").config();

console.log('AirPay Merchant ID loaded:', !!process.env.AIRPAY_MERCHANT_ID);

// ─── DNS fix: resolve MongoDB Atlas SRV via Google DNS to bypass ISP DNS failures ───
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
async function resolveMongoSrvUri(uri) {
  if (!uri || !uri.startsWith("mongodb+srv://")) return uri;
  try {
    const url = new URL(uri);
    const host = url.hostname; // e.g. cluster0.ehqxxl8.mongodb.net
    const userInfo = url.username
      ? `${url.username}:${encodeURIComponent(decodeURIComponent(url.password))}@`
      : "";
    const dbName = url.pathname || "/";

    // Resolve SRV records
    const srvRecords = await new Promise((resolve, reject) => {
      dns.resolveSrv(`_mongodb._tcp.${host}`, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    // Resolve TXT records (contains replicaSet + authSource)
    let txtOptions = {};
    try {
      const txtRecords = await new Promise((resolve, reject) => {
        dns.resolveTxt(host, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });
      const optStr = txtRecords.flat().join("&");
      optStr.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k && v) txtOptions[k] = v;
      });
    } catch (_) {
      // TXT is optional
    }

    // Build host list from SRV
    const hosts = srvRecords
      .map((r) => `${r.name}:${r.port}`)
      .join(",");

    // Merge query params: SRV defaults + TXT options + original URI params
    const params = new URLSearchParams({
      tls: "true",
      authSource: "admin",
      retryWrites: "true",
      w: "majority",
      ...txtOptions,
      ...Object.fromEntries(url.searchParams),
    });

    const directUri = `mongodb://${userInfo}${hosts}${dbName}?${params.toString()}`;
    console.log(`[DNS] SRV resolved → direct URI built for host: ${host}`);
    return directUri;
  } catch (err) {
    console.warn(`[DNS] SRV resolution failed (${err.message}), using original URI`);
    return uri;
  }
}
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ FATAL: Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Add them to your .env file and restart the server.");
  process.exit(1);
}
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const passport = require("./config/passport");
// Add this with your other requires at the top
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const app = express();
const PORT = Number(process.env.PORT) || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";
const isProd = NODE_ENV === "production";
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.disable("x-powered-by");
app.use(compression());
const productionOrigins = new Set(
  [process.env.FRONTEND_URL, process.env.CLIENT_URL].filter(Boolean)
);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: false,
}));

// Handle preflight for all routes
app.options('/{*path}', cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));



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

// Resolve SRV URI before connecting (fixes local ISP DNS failures)
resolveMongoSrvUri(process.env.MONGO_URI).then((resolvedUri) => {
  console.log("[MongoDB] Connecting...");
  return mongoose.connect(resolvedUri, { serverSelectionTimeoutMS: 15000 });
}).then(async () => {
    console.log("✅ MongoDB connected");

    // One-off backend DB cleanup for duplicate projects
    try {
      const Project = require("./models/Project");
      const Transaction = require("./models/Transaction");

      const allProjects = await Project.find({}).sort({ createdAt: -1 });
      const groups = {};

      allProjects.forEach((p) => {
        if (!p.projectName || !p.createdBy) return;
        const key = `${p.createdBy.toString()}||${p.projectName.trim().toLowerCase()}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(p);
      });

      let duplicateCount = 0;
      for (const key of Object.keys(groups)) {
        const projects = groups[key];
        if (projects.length > 1) {
          duplicateCount++;
          const keptProject = projects[0]; // Keep the most recently created one
          const duplicatesToDelete = projects.slice(1);

          console.log(`[Cleanup] Found duplicate projects for name "${keptProject.projectName}". Keeping ${keptProject._id}`);

          for (const dup of duplicatesToDelete) {
            // Re-assign transactions to the kept project
            const updateRes = await Transaction.updateMany(
              { project: dup._id },
              { $set: { project: keptProject._id } }
            );
            if (updateRes.modifiedCount > 0) {
              console.log(`[Cleanup] Reassigned ${updateRes.modifiedCount} transactions from duplicate ${dup._id} to kept project ${keptProject._id}`);
            }

            // Delete the duplicate project
            await Project.deleteOne({ _id: dup._id });
            console.log(`[Cleanup] Deleted duplicate project document: ${dup._id}`);
          }
        }
      }

      if (duplicateCount > 0) {
        console.log(`[Cleanup] Successfully merged ${duplicateCount} duplicate project groups.`);
      } else {
        console.log("[Cleanup] Database is clean. No duplicate projects found.");
      }
      // One-off: Set overseesRoles for supervisors who have none
try {
  const supervisorUpdateRes = await require('./models/User').updateMany(
    { 
      role: 'Supervisor', 
      $or: [
        { overseesRoles: { $exists: false } },
        { overseesRoles: { $size: 0 } }
      ]
    },
    { $set: { overseesRoles: ['Mason', 'Contractor', 'Labourer'] } }
  );
  if (supervisorUpdateRes.modifiedCount > 0) {
    console.log(`[Cleanup] Set default overseesRoles for ${supervisorUpdateRes.modifiedCount} supervisors`);
  }
} catch (cleanupErr) {
  console.error('[Cleanup] overseesRoles patch error:', cleanupErr);
}

      // One-off backend DB cleanup for incorrect Labour/Equipment units
      const invalidUnits = [
        'kg', 'Kg', 'KG',
        'bag', 'Bag', 'BAG',
        'ton', 'Ton', 'TON', 'tons', 'Tons', 'TONS',
        'mt', 'Mt', 'MT',
        'truck', 'Truck', 'TRUCK'
      ];

      const labourUpdateRes = await Transaction.updateMany(
        { type: 'Wages', unit: { $in: invalidUnits } },
        { $set: { unit: 'day' } }
      );
      if (labourUpdateRes.modifiedCount > 0) {
        console.log(`[Cleanup] Migrated ${labourUpdateRes.modifiedCount} Labour entries with invalid units (kg/bag etc.) to 'day'`);
      }

      const equipUpdateRes = await Transaction.updateMany(
        { type: 'Expense', unit: { $in: invalidUnits } },
        { $set: { unit: 'day' } }
      );
      if (equipUpdateRes.modifiedCount > 0) {
        console.log(`[Cleanup] Migrated ${equipUpdateRes.modifiedCount} Equipment entries with invalid units (kg/bag etc.) to 'day'`);
      }
    } catch (cleanupErr) {
      console.error("[Cleanup] Error running database cleanup:", cleanupErr);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

// Database connectivity check middleware
const dbCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.error(`[DBCheck] Blocked request to ${req.originalUrl}: Database not connected (readyState: ${mongoose.connection.readyState})`);
    return res.status(503).json({
      success: false,
      message: "Database is temporarily unavailable. Please try again later.",
    });
  }
  next();
};

app.get("/", (_req, res) =>
  res.json({ status: "ok", app: "BuildTrack API 🏗️", env: NODE_ENV })
);

app.get("/api/test", (_req, res) => res.json({ ok: true }));

// Apply database connectivity check to all other /api routes
app.use("/api", dbCheck);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
console.log("✅ users routes mounted");
app.use("/api/workers", require("./routes/workerRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/reports", require("./routes/aiReportRoutes"));
app.use("/api/reports/dashboard", require("./routes/aiDashboardRoutes"));
app.use("/api/voice", require("./routes/voiceRoutes"));
app.use("/api/project-updates", require("./routes/projectUpdateRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/approvals", require("./routes/approvalsRoutes"));
app.use('/api/subscriptions', subscriptionRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((err, _req, res, _next) => {
  if (!isProd) console.error(err.stack);
  else console.error(`[ERROR] ${err.message}`);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large. Maximum size is 5 MB." });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
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