const multer = require("multer");
const path   = require("path");
const cloudinary = require("./cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "buildtrack",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf"],
    transformation:  [{ quality: "auto", fetch_format: "auto" }],
  },
});
const fileFilter = (_req, file, cb) => {
  const allowedExt  = /\.(jpeg|jpg|png|webp|gif|pdf)$/i;
  const allowedMime = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
  const extOk  = allowedExt.test(path.extname(file.originalname));
  const mimeOk = allowedMime.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error("Only image files (jpg, png, webp, gif) or PDF documents are allowed"));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
module.exports = upload;
