// src/utils/imageUrl.js — Resolves a stored photo value to a displayable URL.
// Cloudinary photos are stored as full URLs; legacy disk photos are just filenames.

const API_ORIGIN =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

/**
 * @param {string|null|undefined} photo — value from DB (full URL or filename)
 * @returns {string} displayable image URL, or empty string if no photo
 */
export function resolveImageUrl(photo) {
  if (!photo) return "";
  // Already a full URL (Cloudinary or any external host)
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  // Legacy local filename
  return `${API_ORIGIN}/uploads/${photo}`;
}
