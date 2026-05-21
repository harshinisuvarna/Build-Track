const express = require("express");
const router = express.Router();
const multer = require("multer");
const Project = require("../models/Project");
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/auth");
const upload = require("../config/multer");
const { getFileUrl, deleteFile } = require("../config/fileHelpers");

router.use(protect);

const normalizeProjectBudget = (project) => {
  if (!project) return project;
  const p = project.toObject ? project.toObject() : project;
  if (!p.budget) {
    p.budget = { total: 0, material: 0, labour: 0, equipment: 0, misc: 0 };
  } else {
    p.budget.material = Number(p.budget.material) || 0;
    p.budget.labour = Number(p.budget.labour) || 0;
    p.budget.equipment = Number(p.budget.equipment) || 0;
    p.budget.misc = Number(p.budget.misc) || 0;
    p.budget.total = Number(p.budget.total) || 0;
    
    if (p.budget.total === 0) {
      p.budget.total = p.budget.material + p.budget.labour + p.budget.equipment + p.budget.misc;
    }
  }
  return p;
};

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

// ==========================================
// GET ALL PROJECTS (SECURED)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;

    // STRICT SECURITY: Only fetch projects created by the logged-in user
    const query = { createdBy: req.user._id };

    if (status && status !== "All") query.status = status;

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { manager: { $regex: search, $options: "i" } },
      ];
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    const normalizedProjects = projects.map(p => normalizeProjectBudget(p));
    res.json({ projects: normalizedProjects });
  } catch {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ==========================================
// GET SINGLE PROJECT
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project: normalizeProjectBudget(project) });
  } catch {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

// ==========================================
// GET PROJECT STATS
// ==========================================
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
                { $in: ["$type", ["Expense", "Wages", "Materials", "Equipment"]] },
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
    const normalized = normalizeProjectBudget(project);
    const totalBudget = normalized.budget.total;
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

// ==========================================
// GET PROJECT BUDGET
// ==========================================
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
        budget: project.budget?.material || 0, // Aligned with schema 'material'
        actual: actualMap["Materials"] || 0,
        remaining: (project.budget?.material || 0) - (actualMap["Materials"] || 0)
      },
      labour: {
        budget: project.budget?.labour || 0,
        actual: actualMap["Wages"] || 0,
        remaining: (project.budget?.labour || 0) - (actualMap["Wages"] || 0)
      },
      equipment: {
        budget: project.budget?.equipment || 0,
        actual: actualMap["Equipment"] || actualMap["Expense"] || 0,
        remaining: (project.budget?.equipment || 0) - (actualMap["Equipment"] || actualMap["Expense"] || 0)
      }
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project budget analysis" });
  }
});

// ==========================================
// CREATE PROJECT
// ==========================================
router.post("/", async (req, res) => {
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  try {
    const {
      projectName, location, manager,
      budgetMaterials, budgetLabour, budgetEquipment, totalBudget,
      startDate, scope, status, progress, clientName, projectCode, buildingType,
      selectedPhaseNames, trackedActivityKeys, completedActivityKeys, selectedPhases
    } = req.body;

    if (!projectName || !projectName.trim())
      return res.status(400).json({ message: "Project name is required" });

    // Fallbacks to satisfy your strict schema if the UI fails to send them
    const safeProjectCode = projectCode || `PRJ-${Date.now()}`;
    const safeClientName = clientName || "Internal Client";
    const safeBuildingType = buildingType || { mainType: "Residential", subType: "Independent" };

    // Resolve both plural (backend) and singular (flutter client) budget naming conventions
    const resolvedMaterial = Number(budgetMaterials !== undefined ? budgetMaterials : req.body.budgetMaterial) || 0;
    const resolvedLabour = Number(budgetLabour !== undefined ? budgetLabour : req.body.budgetLabour) || 0;
    const resolvedEquipment = Number(budgetEquipment !== undefined ? budgetEquipment : req.body.budgetEquipment) || 0;
    const resolvedMisc = Number(req.body.budgetMisc !== undefined ? req.body.budgetMisc : (req.body.budget?.misc !== undefined ? req.body.budget.misc : 0)) || 0;
    
    // Resolve totalBudget either at the root or within nested budget object
    let resolvedTotal = Number(totalBudget !== undefined ? totalBudget : (req.body.budget?.total !== undefined ? req.body.budget.total : req.body.totalBudget));
    if (isNaN(resolvedTotal) || resolvedTotal === 0) {
      resolvedTotal = resolvedMaterial + resolvedLabour + resolvedEquipment + resolvedMisc;
    }

    const project = await Project.create({
      createdBy: req.user._id,
      projectName: projectName.trim(),
      projectCode: safeProjectCode,
      clientName: safeClientName,
      buildingType: safeBuildingType,
      location: location || "",
      manager: manager || "",
      budget: {
        total: resolvedTotal || 0,
        material: resolvedMaterial,
        labour: resolvedLabour,
        equipment: resolvedEquipment,
        misc: resolvedMisc
      },
      startDate: startDate || null,
      scope: scope || "",
      status: status || "Active",
      progress: Number(progress) || 0,
      photo: getFileUrl(req.files?.find(f => f.fieldname === "photo")) || null,
      selectedPhaseNames: typeof selectedPhaseNames === 'string' ? JSON.parse(selectedPhaseNames) : (selectedPhaseNames || []),
      trackedActivityKeys: typeof trackedActivityKeys === 'string' ? JSON.parse(trackedActivityKeys) : (trackedActivityKeys || []),
      completedActivityKeys: typeof completedActivityKeys === 'string' ? JSON.parse(completedActivityKeys) : (completedActivityKeys || []),
      selectedPhases: typeof selectedPhases === 'string' ? JSON.parse(selectedPhases) : (selectedPhases || []),
    });

    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to create project: " + (err.message || err.toString()), error: err });
  }
});

// ==========================================
// UPDATE PROJECT
// ==========================================
router.put("/:id", async (req, res) => {
  try { await runUpload(req, res); }
  catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  try {
    const {
      projectName, location, manager,
      budgetMaterials, budgetLabour, budgetEquipment, totalBudget,
      startDate, scope, status, progress, removePhoto, clientName, buildingType,
      selectedPhaseNames, trackedActivityKeys, completedActivityKeys, selectedPhases
    } = req.body;

    const existing = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!existing) return res.status(404).json({ message: "Project not found" });

    const updateData = {};
    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location !== undefined) updateData.location = location;
    if (manager !== undefined) updateData.manager = manager;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (buildingType !== undefined) updateData.buildingType = buildingType;

    // Resolve both plural (backend) and singular (flutter client) budget naming conventions
    const inputMaterial = budgetMaterials !== undefined ? budgetMaterials : req.body.budgetMaterial;
    const inputLabour = budgetLabour !== undefined ? budgetLabour : req.body.budgetLabour;
    const inputEquipment = budgetEquipment !== undefined ? budgetEquipment : req.body.budgetEquipment;
    const inputMisc = req.body.budgetMisc !== undefined ? req.body.budgetMisc : (req.body.budget?.misc !== undefined ? req.body.budget.misc : undefined);
    
    // Resolve totalBudget either at the root or within nested budget object
    const inputTotal = totalBudget !== undefined ? totalBudget : (req.body.budget?.total !== undefined ? req.body.budget.total : req.body.totalBudget);

    if (inputMaterial !== undefined || inputLabour !== undefined || inputEquipment !== undefined || inputMisc !== undefined || inputTotal !== undefined) {
      const existingBudget = existing.budget || {};
      
      const material = inputMaterial !== undefined ? (Number(inputMaterial) || 0) : (existingBudget.material || 0);
      const labour = inputLabour !== undefined ? (Number(inputLabour) || 0) : (existingBudget.labour || 0);
      const equipment = inputEquipment !== undefined ? (Number(inputEquipment) || 0) : (existingBudget.equipment || 0);
      const misc = inputMisc !== undefined ? (Number(inputMisc) || 0) : (existingBudget.misc || 0);
      
      let total = inputTotal !== undefined ? (Number(inputTotal) || 0) : (existingBudget.total || 0);
      if (total === 0) {
        total = material + labour + equipment + misc;
      }
      
      updateData.budget = { total, material, labour, equipment, misc };
    }

    if (startDate !== undefined) updateData.startDate = startDate || null;
    if (scope !== undefined) updateData.scope = scope;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = Number(progress);

    if (selectedPhaseNames !== undefined) {
      updateData.selectedPhaseNames = typeof selectedPhaseNames === 'string' ? JSON.parse(selectedPhaseNames) : selectedPhaseNames;
    }
    if (trackedActivityKeys !== undefined) {
      updateData.trackedActivityKeys = typeof trackedActivityKeys === 'string' ? JSON.parse(trackedActivityKeys) : trackedActivityKeys;
    }
    if (completedActivityKeys !== undefined) {
      updateData.completedActivityKeys = typeof completedActivityKeys === 'string' ? JSON.parse(completedActivityKeys) : completedActivityKeys;
    }
    if (selectedPhases !== undefined) {
      updateData.selectedPhases = typeof selectedPhases === 'string' ? JSON.parse(selectedPhases) : selectedPhases;
    }

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
      { $set: updateData },
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

// ==========================================
// DELETE PROJECT
// ==========================================
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