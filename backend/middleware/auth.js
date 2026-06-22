const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

const SECRET = process.env.JWT_SECRET;

// ── protect ──────────────────────────────────────────────────────────────────
// Verifies JWT, attaches full user doc to req.user
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorised — no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    const user = await User.findById(decoded.id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    // Guard against invalidated sessions (sign-out-all)
    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session expired — please log in again" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ── authorize ─────────────────────────────────────────────────────────────────
// Role-based guard — pass one or more role strings
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      message: `Access denied — requires role: ${roles.join(" or ")}`,
    });
  }
  next();
};

// ── requirePermission ─────────────────────────────────────────────────────────
// Permission-based guard — pass an array of permission keys (OR logic).
// Admins always pass through.
const requirePermission = (permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role === "Admin") return next();

  const userPermissions = Array.isArray(req.user.permissions)
    ? req.user.permissions
    : [];

  const hasPermission = permissions.some((p) => userPermissions.includes(p));

  if (!hasPermission) {
    return res.status(403).json({
      message: `Access denied — requires permission: ${permissions.join(" or ")}`,
    });
  }

  next();
};

// ── getAdminId ────────────────────────────────────────────────────────────────
// Returns the root Admin's _id for a given user.
// - Admin  → their own _id
// - Others → createdBy (the Admin who provisioned them)
// This ensures workers/inventory scoped to the organisation's Admin
// are visible to all members of that organisation.
const getAdminId = async (user) => {
  if (!user) return null;

  if (user.role === "Admin") {
    return user._id;
  }

  // Prefer the populated createdBy field; fall back to a DB lookup
  if (user.createdBy) {
    return typeof user.createdBy === "object" && user.createdBy._id
      ? user.createdBy._id
      : user.createdBy;
  }

  // Edge-case: createdBy not set — look up from DB
  const freshUser = await User.findById(user._id).select("createdBy role").lean();
  return freshUser?.createdBy || user._id;
};

// ── canAccessProjectFilter ────────────────────────────────────────────────────
// Returns a Mongoose query filter for projects a user may READ.
//
//  Admin       → all projects they created              { createdBy: adminId }
//  Non-admin   → only projects they are assigned to     { _id: { $in: [...] } }
//
// Pass an optional projectId to produce a single-document filter
// (used for "does this user have access to THIS project?" checks).
const canAccessProjectFilter = (req, projectId = null) => {
  const user = req.user;

  if (user.role === "Admin") {
    if (projectId) return { _id: projectId, createdBy: user._id };
    return { createdBy: user._id };
  }

  // Merge projectIds array + legacy single projectId
  const assignedIds = Array.isArray(user.projectIds)
    ? user.projectIds.filter(Boolean).map((id) => id.toString())
    : [];

  if (user.projectId) {
    const legacyId = user.projectId.toString();
    if (!assignedIds.includes(legacyId)) assignedIds.push(legacyId);
  }

  const objectIds = assignedIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (projectId) {
    // Single-document check: must be in assigned list
    const pidStr = projectId.toString();
    if (!assignedIds.includes(pidStr)) {
      // Return a filter that will never match — forces 404/403 upstream
      return { _id: new mongoose.Types.ObjectId(), __never: true };
    }
    return { _id: projectId };
  }

  return { _id: { $in: objectIds } };
};

// ── canManageProjectFilter ────────────────────────────────────────────────────
// Returns a Mongoose query filter for projects a user may WRITE (edit/delete).
//
//  Admin       → projects they created                  { _id, createdBy }
//  Non-admin   → assigned projects only (they must also hold the relevant
//                edit/delete permission, checked separately via requirePermission)
const canManageProjectFilter = (req, projectId = null) => {
  const user = req.user;

  if (user.role === "Admin") {
    if (projectId) return { _id: projectId, createdBy: user._id };
    return { createdBy: user._id };
  }

  // Non-admins: same scope as canAccessProjectFilter —
  // they need the matching permission guard applied on the route as well.
  return canAccessProjectFilter(req, projectId);
};

module.exports = {
  protect,
  authorize,
  requirePermission,
  getAdminId,
  canAccessProjectFilter,
  canManageProjectFilter,
};