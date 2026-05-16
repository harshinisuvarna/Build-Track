const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const Project     = require("../models/Project");
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/auth");
const upload      = require("../config/multer");
const { getFileUrl, deleteFile } = require("../config/fileHelpers");
const { getProjectConfig } = require("../controllers/projectController");
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

router.get("/:id/config", getProjectConfig);

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
                { $in: ["$type", ["equipment", "labour", "material"]] },
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
        actual: actualMap["material"] || 0, 
        remaining: (project.budget?.materials || 0) - (actualMap["material"] || 0)
      },
      labour: {
        budget: project.budget?.labour || 0,
        actual: actualMap["labour"] || 0, 
        remaining: (project.budget?.labour || 0) - (actualMap["labour"] || 0)
      },
      equipment: {
        budget: project.budget?.equipment || 0,
        actual: actualMap["equipment"] || 0,
        remaining: (project.budget?.equipment || 0) - (actualMap["equipment"] || 0)
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
      // Core fields
      projectName, location, manager,
      startDate, scope, status, progress,
      // Enterprise fields required by schema
      clientName, projectCode, buildingType,
      // Optional enterprise fields
      contractorName, siteEngineerName, contactNumber,
      // Nested objects (new Flutter payload format)
      budget, dates,
      // Legacy flat budget fields (backward compat)
      budgetMaterials, budgetLabour, budgetEquipment,
      expectedEndDate, actualEndDate,
      // Execution tracker arrays
      selectedPhaseNames, trackedActivityKeys,
      completedActivityKeys, selectedPhases,
    } = req.body;

    if (!projectName || !projectName.trim())
      return res.status(400).json({ message: "Project name is required" });

    // ── Normalise status to exact enum values ──────────────────────────
    // Schema enum: ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]
    const STATUS_MAP = {
      planning:      "Planning",
      "in progress": "In Progress",
      ongoing:       "In Progress",
      active:        "In Progress",
      "on hold":     "On Hold",
      completed:     "Completed",
      cancelled:     "Cancelled",
    };
    const normalisedStatus =
      STATUS_MAP[(status || "").toLowerCase().trim()] || "Planning";

    // ── Build budget: prefer nested object, fall back to legacy flat fields ──
    const resolvedBudget = budget && typeof budget === "object"
      ? {
          total:     Number(budget.total     ?? 0),
          material:  Number(budget.material  ?? 0),
          labour:    Number(budget.labour    ?? 0),
          equipment: Number(budget.equipment ?? 0),
          misc:      Number(budget.misc      ?? 0),
        }
      : {
          total:     Number(budgetMaterials || 0) + Number(budgetLabour || 0) + Number(budgetEquipment || 0),
          material:  Number(budgetMaterials  || 0),
          labour:    Number(budgetLabour     || 0),
          equipment: Number(budgetEquipment  || 0),
          misc:      0,
        };

    // ── Build dates: prefer nested object, fall back to legacy flat fields ──
    const resolvedDates = dates && typeof dates === "object"
      ? {
          startDate:       dates.startDate       || null,
          expectedEndDate: dates.expectedEndDate || null,
          actualEndDate:   dates.actualEndDate   || null,
        }
      : {
          startDate:       startDate       || null,
          expectedEndDate: expectedEndDate || null,
          actualEndDate:   actualEndDate   || null,
        };

    const project = await Project.create({
      createdBy:        req.user._id,
      projectName:      projectName.trim(),
      location:         location || "",
      manager:          manager  || "",

      // Required enterprise fields
      clientName:       clientName  || "Internal Client",
      projectCode:      projectCode || `PRJ-${Date.now()}`,
      buildingType:     buildingType || { mainType: "Residential", subType: "General" },

      // Optional enterprise fields
      contractorName:   contractorName   || undefined,
      siteEngineerName: siteEngineerName || undefined,
      contactNumber:    contactNumber    || undefined,

      budget: resolvedBudget,
      dates:  resolvedDates,

      status:   normalisedStatus,
      scope:    scope    || "",
      progress: Number(progress) || 0,
      photo:    getFileUrl(req.files?.find(f => f.fieldname === "photo")) || null,

      // Execution tracker arrays
      selectedPhaseNames:    Array.isArray(selectedPhaseNames)    ? selectedPhaseNames    : [],
      trackedActivityKeys:   Array.isArray(trackedActivityKeys)   ? trackedActivityKeys   : [],
      completedActivityKeys: Array.isArray(completedActivityKeys) ? completedActivityKeys : [],
      selectedPhases:        Array.isArray(selectedPhases)        ? selectedPhases        : [],
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
      // Core fields
      projectName, location, manager,
      startDate, scope, status, progress, removePhoto,
      // Enterprise fields
      clientName, projectCode, buildingType,
      contractorName, siteEngineerName, contactNumber,
      // Nested objects (new Flutter payload format)
      budget, dates,
      // Legacy flat budget fields (backward compat)
      budgetMaterials, budgetLabour, budgetEquipment,
      expectedEndDate, actualEndDate,
      // Execution tracker arrays
      selectedPhaseNames, trackedActivityKeys,
      completedActivityKeys, selectedPhases,
    } = req.body;

    const updateData = {};

    // ── Core fields ───────────────────────────────────────────────────
    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location    !== undefined) updateData.location    = location;
    if (manager     !== undefined) updateData.manager     = manager;
    if (scope       !== undefined) updateData.scope       = scope;
    if (progress    !== undefined) updateData.progress    = Number(progress);

    // ── Enterprise fields ─────────────────────────────────────────────
    if (clientName       !== undefined) updateData.clientName       = clientName;
    if (projectCode      !== undefined) updateData.projectCode      = projectCode;
    if (buildingType     !== undefined) updateData.buildingType     = buildingType;
    if (contractorName   !== undefined) updateData.contractorName   = contractorName;
    if (siteEngineerName !== undefined) updateData.siteEngineerName = siteEngineerName;
    if (contactNumber    !== undefined) updateData.contactNumber    = contactNumber;

    // ── Status normalisation ──────────────────────────────────────────
    if (status !== undefined) {
      const STATUS_MAP = {
        planning:      "Planning",
        "in progress": "In Progress",
        ongoing:       "In Progress",
        active:        "In Progress",
        "on hold":     "On Hold",
        completed:     "Completed",
        cancelled:     "Cancelled",
      };
      updateData.status = STATUS_MAP[(status || "").toLowerCase().trim()] || status;
    }

    // ── Budget: prefer nested object, fall back to legacy flat fields ─
    if (budget !== undefined && typeof budget === "object") {
      updateData.budget = {
        total:     Number(budget.total     ?? 0),
        material:  Number(budget.material  ?? 0),
        labour:    Number(budget.labour    ?? 0),
        equipment: Number(budget.equipment ?? 0),
        misc:      Number(budget.misc      ?? 0),
      };
    } else if (budgetMaterials !== undefined || budgetLabour !== undefined || budgetEquipment !== undefined) {
      updateData.budget = {};
      if (budgetMaterials !== undefined) updateData.budget.material  = Number(budgetMaterials);
      if (budgetLabour    !== undefined) updateData.budget.labour    = Number(budgetLabour);
      if (budgetEquipment !== undefined) updateData.budget.equipment = Number(budgetEquipment);
      updateData.budget.total = (Number(budgetMaterials || 0) + Number(budgetLabour || 0) + Number(budgetEquipment || 0));
    }

    // ── Dates: prefer nested object, fall back to legacy flat fields ──
    if (dates !== undefined && typeof dates === "object") {
      updateData.dates = {
        startDate:       dates.startDate       || null,
        expectedEndDate: dates.expectedEndDate || null,
        actualEndDate:   dates.actualEndDate   || null,
      };
    } else {
      if (startDate       !== undefined) updateData["dates.startDate"]       = startDate || null;
      if (expectedEndDate !== undefined) updateData["dates.expectedEndDate"] = expectedEndDate || null;
      if (actualEndDate   !== undefined) updateData["dates.actualEndDate"]   = actualEndDate || null;
    }

    // ── Execution tracker arrays ──────────────────────────────────────
    if (selectedPhaseNames    !== undefined) updateData.selectedPhaseNames    = Array.isArray(selectedPhaseNames)    ? selectedPhaseNames    : [];
    if (trackedActivityKeys   !== undefined) updateData.trackedActivityKeys   = Array.isArray(trackedActivityKeys)   ? trackedActivityKeys   : [];
    if (completedActivityKeys !== undefined) updateData.completedActivityKeys = Array.isArray(completedActivityKeys) ? completedActivityKeys : [];
    if (selectedPhases        !== undefined) updateData.selectedPhases        = Array.isArray(selectedPhases)        ? selectedPhases        : [];

    // ── Photo handling ────────────────────────────────────────────────
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
