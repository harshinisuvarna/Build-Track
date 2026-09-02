const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getNotifications, markAsRead, markAllAsRead, deleteAll } = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllAsRead);
router.delete("/all", protect, deleteAll);
router.put("/:id/read", protect, markAsRead);

module.exports = router;
