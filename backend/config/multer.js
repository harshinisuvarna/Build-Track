// config/multer.js — single shared multer instance used across ALL routes
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Use process.cwd() so the path is correct regardless of __dirname context
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Disk storage ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

// ── File type filter: images + PDFs only ──────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowedExt  = /\.(jpeg|jpg|png|webp|gif|pdf)$/i;
  const allowedMime = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
  const extOk  = allowedExt.test(path.extname(file.originalname));
  const mimeOk = allowedMime.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error("Only image files (jpg, png, webp, gif) or PDF documents are allowed"));
};

// ── Exported upload instance (10 MB hard limit) ───────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
