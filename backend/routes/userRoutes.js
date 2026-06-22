const express = require("express");
const router  = express.Router();
const { updateProfile, updateSubscription, getSubscription, getProfile, updateProfilePhoto, assignOversightRoles } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.get("/profile",       protect, getProfile);
router.put("/profile/photo", protect, updateProfilePhoto);  // ← must be BEFORE /profile
router.put("/profile",       protect, updateProfile);
router.get("/subscription", protect, getSubscription);
router.put("/subscription", protect, updateSubscription);

// Admin route to assign oversight roles to supervisors
router.put("/:id/oversight", protect, authorize("Admin"), assignOversightRoles);

module.exports = router;