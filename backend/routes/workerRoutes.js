// backend/routes/workerRoutes.js
const express     = require("express");
const router      = express.Router();
const path        = require("path");
const fs          = require("fs");
const Worker      = require("../models/Worker");
const { protect } = require("../middleware/auth");
const upload      = require("../config/multer");

// All routes below require a valid JWT
router.use(protect);


// ─── GET ALL WORKERS ─────────────────────────────────────────────────────────
// GET /api/workers
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { createdBy: req.user._id };

    if (status && status !== "All") query.status = status;

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { trade: { $regex: search, $options: "i" } },
      ];
    }

    const workers = await Worker.find(query).sort({ createdAt: -1 });
    res.json({ workers });

  } catch (err) {
    console.error("Get workers error:", err);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});


// ─── STATS SUMMARY ───────────────────────────────────────────────────────────
// GET /api/workers/stats/summary
// ⚠️  MUST be defined BEFORE /:id so Express doesn't treat "stats" as an ID
router.get("/stats/summary", async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      Worker.countDocuments({ createdBy: req.user._id }),
      Worker.countDocuments({ createdBy: req.user._id, status: "Active" }),
      Worker.countDocuments({ createdBy: req.user._id, status: "Inactive" }),
    ]);
    res.json({ total, active, inactive });
  } catch {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});


// ─── GET SUPERVISORS ─────────────────────────────────────────────────────────
// GET /api/workers/supervisors
// Returns all active workers whose trade is "Supervisor" — used for manager dropdown
// ⚠️  MUST be defined BEFORE /:id so Express doesn't treat "supervisors" as an ID
router.get("/supervisors", async (req, res) => {
  try {
    const supervisors = await Worker.find({
      createdBy: req.user._id,
      trade:     "Supervisor",
    })
      .select("name trade status")
      .sort({ name: 1 });

    res.json({ supervisors });
  } catch (err) {
    console.error("Get supervisors error:", err);
    res.status(500).json({ message: "Failed to fetch supervisors" });
  }
});


// ─── GET SINGLE WORKER ───────────────────────────────────────────────────────
// GET /api/workers/:id
router.get("/:id", async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json({ worker });
  } catch {
    res.status(500).json({ message: "Failed to fetch worker" });
  }
});


// ─── CREATE WORKER ───────────────────────────────────────────────────────────
// POST /api/workers
// Accepts multipart/form-data (with optional photo file)
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { name, trade, mobile, joiningDate, status, dailyWage, paymentCycle } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ message: "Worker name is required" });

    if (!dailyWage && dailyWage !== "0")
      return res.status(400).json({ message: "Daily wage is required" });

    const worker = await Worker.create({
      createdBy:   req.user._id,
      name:        name.trim(),
      trade:       trade || "General Labor",
      mobile:      mobile || "",
      joiningDate: joiningDate || null,
      status:      status || "Active",
      dailyWage:   Number(dailyWage) || 0,
      paymentCycle: paymentCycle || "Weekly",
      photo:       req.file ? req.file.filename : null,  // ← save filename only
    });

    res.status(201).json({ message: "Worker added successfully", worker });

  } catch (err) {
    console.error("Create worker error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to create worker" });
  }
});


// ─── UPDATE WORKER ───────────────────────────────────────────────────────────
// PUT /api/workers/:id
// Accepts multipart/form-data (with optional new photo)
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const { name, trade, mobile, joiningDate, status, dailyWage, paymentCycle } = req.body;

    // Build update object
    const updateData = {
      name:        name?.trim(),
      trade,
      mobile,
      joiningDate,
      status,
      dailyWage:   Number(dailyWage),
      paymentCycle,
    };

    // If a new photo was uploaded, delete the old one and save the new filename
    if (req.file) {
      // Delete old photo file from disk if it exists
      const existing = await Worker.findOne({ _id: req.params.id, createdBy: req.user._id });
      if (existing?.photo) {
        const oldPath = path.join(__dirname, "../uploads", existing.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.photo = req.file.filename;
    }

    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    res.json({ message: "Worker updated", worker });

  } catch (err) {
    console.error("Update worker error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to update worker" });
  }
});


// ─── DELETE WORKER ───────────────────────────────────────────────────────────
// DELETE /api/workers/:id
router.delete("/:id", async (req, res) => {
  try {
    const worker = await Worker.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    // Also delete photo file from disk
    if (worker.photo) {
      const photoPath = path.join(__dirname, "../uploads", worker.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    res.json({ message: "Worker deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete worker" });
  }
});


module.exports = router;
