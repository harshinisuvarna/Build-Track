// backend/config/multer.js
// Multer config shared across Workers AND Projects routes.
// Files saved to: backend/uploads/{timestamp}-{random}.{ext}
// Max size: 10 MB. Only images allowed.

const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Ensure uploads/ folder exists at runtime
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Disk storage config ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g.  1711000000000-492837465.jpg
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

// ── File type filter — images only ───────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error("Only image files are allowed (jpg, png, webp, gif)"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // ← raised to 10 MB
});

module.exports = upload;
