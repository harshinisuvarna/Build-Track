const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET || "buildtrack_secret_change_in_prod";

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorised — no token" });
    }

    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);

    // Attach user to request (password excluded via toJSON)
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protect };
