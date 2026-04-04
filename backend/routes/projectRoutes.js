// backend/routes/projectRoutes.js
const express     = require("express");
const router      = express.Router();
const path        = require("path");
const fs          = require("fs");
const multer      = require("multer");
const Project     = require("../models/Project");
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/auth");
const upload      = require("../config/multer");

// All routes require valid JWT
router.use(protect);

// Helper: run multer, catch MulterError cleanly
const runUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.any()(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        reject(Object.assign(err, { status: 400 }));
      } else if (err) {
        reject(Object.assign(err, { status: 400 }));
      } else {
        resolve();
      }
    });
  });

// ─── GET ALL PROJECTS ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { createdBy: req.user._id };

    if (status && status !== "All") query.status = status;

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
        { manager:     { $regex: search, $options: "i" } },
      ];
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json({ projects });
  } catch {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ─── GET SINGLE PROJECT ──────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

// ─── GET PROJECT FINANCIAL STATS ─────────────────────────────────────────────
// Uses MongoDB aggregation on real transaction data instead of progress-based estimates
router.get("/:id/stats", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const mongoose = require("mongoose");
    const projectObjectId = new mongoose.Types.ObjectId(req.params.id);

    const result = await Transaction.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: null,
          totalSpent: {
            $sum: {
              $cond: [
                { $in: ["$type", ["Expense", "Wages", "Materials"]] },
                "$amount",
                0,
              ],
            },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "Income"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const { totalSpent = 0, totalIncome = 0 } = result[0] || {};
    const totalBudget = Number(project.budget) || 0;
    const remainingBudget = totalBudget - totalSpent;

    res.json({
      totalBudget,
      totalSpent,
      totalIncome,
      remainingBudget,
      projectName: project.projectName,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project stats" });
  }
});


// ─── CREATE PROJECT ──────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  try {
    const { projectName, location, manager, budget, startDate, scope, status, progress } = req.body;

    if (!projectName || !projectName.trim())
      return res.status(400).json({ message: "Project name is required" });

    const project = await Project.create({
      createdBy:   req.user._id,
      projectName: projectName.trim(),
      location:    location  || "",
      manager:     manager   || "",
      budget:      Number(budget)   || 0,
      startDate:   startDate || null,
      scope:       scope     || "",
      status:      status    || "Active",
      progress:    Number(progress) || 0,
      photo:       req.files?.find(f => f.fieldname === "photo")?.filename || null,
    });

    // ── Auto-create a transaction log entry when a project is created ──
    try {
      const budgetAmount = Number(budget) || 0;
      await Transaction.create({
        createdBy: req.user._id.toString(),
        title:     `Project Created - ${project.projectName}`,
        amount:    budgetAmount,
        type:      "Expense",
        project:   project._id.toString(),
        date:      new Date(),
        notes:     `Auto-generated on project creation. Budget: ₹${budgetAmount}`,
      });
    } catch {
      // Transaction creation is non-critical — project was still saved
    }

    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to create project" });
  }
});

// ─── UPDATE PROJECT ──────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }
  try {
    const { projectName, location, manager, budget, startDate, scope, status, progress, removePhoto } = req.body;
    const updateData = {};
    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location !== undefined)    updateData.location    = location;
    if (manager !== undefined)     updateData.manager     = manager;
    if (budget !== undefined)      updateData.budget      = Number(budget);
    if (startDate !== undefined)   updateData.startDate   = startDate || null;
    if (scope !== undefined)       updateData.scope       = scope;
    if (status !== undefined)      updateData.status      = status;
    if (progress !== undefined)    updateData.progress    = Number(progress);

    const existing = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });

    const photoFile = req.files?.find(f => f.fieldname === "photo");
    if (photoFile && existing) {
      if (existing.photo) {
        const oldPath = path.join(__dirname, "../uploads", existing.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.photo = photoFile.filename;
    } else if (removePhoto === "true" && existing?.photo) {
      const oldPath = path.join(__dirname, "../uploads", existing.photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      updateData.photo = null;
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project updated", project });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to update project" });
  }
});

// ─── DELETE PROJECT ──────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.photo) {
      const photoPath = path.join(__dirname, "../uploads", project.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    res.json({ message: "Project deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete project" });
  }
});


module.exports = router;