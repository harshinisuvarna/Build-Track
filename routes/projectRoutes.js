const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const Project     = require("../models/Project");
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/auth");
const upload      = require("../config/multer");
const { getFileUrl, deleteFile } = require("../config/fileHelpers");
router.use(protect);
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
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});
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
router.get("/:id/budget", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const mongoose = require("mongoose");
    const projectObjectId = new mongoose.Types.ObjectId(req.params.id);

    const actuals = await Transaction.aggregate([
      { $match: { project: projectObjectId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const actualMap = {};
    actuals.forEach(a => { actualMap[a._id] = a.total; });

    const report = {
      materials: {
        budget: project.budget?.materials || 0,
        actual: actualMap["Materials"] || 0,
        remaining: (project.budget?.materials || 0) - (actualMap["Materials"] || 0)
      },
      labour: {
        budget: project.budget?.labour || 0,
        actual: actualMap["Wages"] || 0,
        remaining: (project.budget?.labour || 0) - (actualMap["Wages"] || 0)
      },
      equipment: {
        budget: project.budget?.equipment || 0,
        actual: actualMap["Expense"] || 0,
        remaining: (project.budget?.equipment || 0) - (actualMap["Expense"] || 0)
      }
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project budget analysis" });
  }
});

router.post("/", async (req, res) => {
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }
  try {
    const { 
      projectName, location, manager, 
      budgetMaterials, budgetLabour, budgetEquipment,
      startDate, scope, status, progress 
    } = req.body;

    if (!projectName || !projectName.trim())
      return res.status(400).json({ message: "Project name is required" });

    const project = await Project.create({
      createdBy:   req.user._id,
      projectName: projectName.trim(),
      location:    location  || "",
      manager:     manager   || "",
      budget: {
        materials: Number(budgetMaterials) || 0,
        labour:    Number(budgetLabour)    || 0,
        equipment: Number(budgetEquipment) || 0,
      },
      startDate:   startDate || null,
      scope:       scope     || "",
      status:      status    || "Active",
      progress:    Number(progress) || 0,
      photo:       getFileUrl(req.files?.find(f => f.fieldname === "photo")) || null,
    });
    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to create project" });
  }
});

router.put("/:id", async (req, res) => {
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }
  try {
    const { 
      projectName, location, manager, 
      budgetMaterials, budgetLabour, budgetEquipment,
      startDate, scope, status, progress, removePhoto 
    } = req.body;

    const updateData = {};
    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location    !== undefined) updateData.location    = location;
    if (manager     !== undefined) updateData.manager     = manager;
    
    // Handle nested budget update
    if (budgetMaterials !== undefined || budgetLabour !== undefined || budgetEquipment !== undefined) {
      updateData.budget = {};
      if (budgetMaterials !== undefined) updateData.budget.materials = Number(budgetMaterials);
      if (budgetLabour    !== undefined) updateData.budget.labour    = Number(budgetLabour);
      if (budgetEquipment !== undefined) updateData.budget.equipment = Number(budgetEquipment);
    }

    if (startDate   !== undefined) updateData.startDate   = startDate || null;
    if (scope       !== undefined) updateData.scope       = scope;
    if (status      !== undefined) updateData.status      = status;
    if (progress    !== undefined) updateData.progress    = Number(progress);

    const existing = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    const photoFile = req.files?.find(f => f.fieldname === "photo");
    if (photoFile && existing) {
      if (existing.photo) await deleteFile(existing.photo);
      updateData.photo = getFileUrl(photoFile);
    } else if (removePhoto === "true" && existing?.photo) {
      await deleteFile(existing.photo);
      updateData.photo = null;
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { $set: updateData }, // Use $set to avoid overwriting the whole budget object if only one part changed
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

router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.photo) await deleteFile(project.photo);
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete project" });
  }
});

module.exports = router;