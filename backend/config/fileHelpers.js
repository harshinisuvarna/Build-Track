const cloudinary = require("./cloudinary");
function getFileUrl(file) {
  if (!file) return null;
  return file.path || null;
}
/**
 * 
 * @param {string} storedValue — the full Cloudinary URL saved in the DB
 */
async function deleteFile(storedValue) {
  if (!storedValue || !storedValue.startsWith("http")) return;
  try {
    const parts = storedValue.split("/upload/");
    if (parts[1]) {
      const publicId = parts[1]
        .replace(/^v\d+\//, "")   // strip version
        .replace(/\.[^.]+$/, ""); // strip extension
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
}
module.exports = { getFileUrl, deleteFile };
