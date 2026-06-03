const jwt = require("jsonwebtoken");
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

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account deactivated. Contact support." });
    }

    if (
      user.tokenVersion != null &&
      decoded.tokenVersion != null &&
      decoded.tokenVersion < user.tokenVersion
    ) {
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  };
};

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userPermissions = Array.isArray(req.user.permissions)
      ? req.user.permissions
      : [];

    const hasPermission = permissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (hasPermission || req.user.role === "Admin") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions",
    });
  };
};

module.exports = { protect, authorize, requirePermission };