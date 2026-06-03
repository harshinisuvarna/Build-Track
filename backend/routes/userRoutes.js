const express = require("express");
const router  = express.Router();
const { updateProfile, updateSubscription, getSubscription, getProfile } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/profile", protect, getProfile);
router.put("/profile",      protect, updateProfile);
router.get("/subscription", protect, getSubscription);
router.put("/subscription", protect, updateSubscription);

module.exports = router;