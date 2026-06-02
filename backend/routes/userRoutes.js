const express = require("express");
const router = express.Router();
const { updateProfile } = require("../controllers/userController");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/users/profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "User",
        profilePhoto: user.profilePhoto || null,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// PUT /api/users/profile
router.put("/profile", updateProfile);

// GET /api/users/subscription
router.get("/subscription", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({
      subscription: user.subscription || { plan: "free", status: "active", renewalDate: null }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
});

// PUT /api/users/subscription
router.put("/subscription", async (req, res) => {
  try {
    const { plan, status, renewalDate, purchaseToken } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.subscription = {
      plan: plan || "free",
      status: status || "active",
      renewalDate: renewalDate ? new Date(renewalDate) : null,
      purchaseToken: purchaseToken || null
    };
    
    await user.save();
    res.json({ message: "Subscription updated successfully", subscription: user.subscription });
  } catch (err) {
    res.status(500).json({ message: "Failed to update subscription" });
  }
});

module.exports = router;
