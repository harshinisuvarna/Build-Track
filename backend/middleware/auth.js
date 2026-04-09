const jwt  = require("jsonwebtoken");
const User = require("../models/User");
if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable must be set. " +
    "Add it to your .env file before starting the server."
  );
}
const SECRET = process.env.JWT_SECRET;
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorised — no token" });
    }
    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ message: "Account deactivated. Contact support." });
    }
    if (req.user.tokenVersion != null && decoded.tokenVersion != null) {
      if (decoded.tokenVersion < req.user.tokenVersion) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
    }
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
module.exports = { protect };
