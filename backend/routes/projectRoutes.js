// backend/routes/projectRoutes.js
const express     = require("express");
const router      = express.Router();
const path        = require("path");
const fs          = require("fs");
const multer      = require("multer");
const Project     = require("../models/Project");
const { protect } = require("../middleware/auth");
const upload      = require("../config/multer");   // reuse existing multer config

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
// GET /api/projects
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
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});


// ─── GET SINGLE PROJECT ──────────────────────────────────────────────────────
// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});


// ─── CREATE PROJECT ──────────────────────────────────────────────────────────
// POST /api/projects   (multipart/form-data, optional photo)
router.post("/", async (req, res) => {
  // Run multer first
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

    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    console.error("Create project error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to create project" });
  }
});



// ─── UPDATE PROJECT ──────────────────────────────────────────────────────────
// PUT /api/projects/:id   (multipart/form-data, optional new photo)
router.put("/:id", async (req, res) => {
  // Run multer first
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  try {
    const { projectName, location, manager, budget, startDate, scope, status, progress } = req.body;

    // Bug 34: Build updateData carefully — only include defined fields
    const updateData = {};
    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location !== undefined)    updateData.location    = location;
    if (manager !== undefined)     updateData.manager     = manager;
    if (budget !== undefined)      updateData.budget      = Number(budget);
    if (startDate !== undefined)   updateData.startDate   = startDate || null;
    if (scope !== undefined)       updateData.scope       = scope;
    if (status !== undefined)      updateData.status      = status;
    if (progress !== undefined)    updateData.progress    = Number(progress);

    const photoFile = req.files?.find(f => f.fieldname === "photo");
    if (photoFile) {
      // Delete old photo from disk
      const existing = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
      if (existing?.photo) {
        const oldPath = path.join(__dirname, "../uploads", existing.photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.photo = photoFile.filename;
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project updated", project });
  } catch (err) {
    console.error("Update project error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to update project" });
  }
});



// ─── DELETE PROJECT ──────────────────────────────────────────────────────────
// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Delete photo from disk too
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
