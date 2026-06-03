const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Transaction = require("../models/Transaction");
const { protect, requirePermission } = require("../middleware/auth");
const upload = require("../config/multer");
const { getFileUrl, deleteFile } = require("../config/fileHelpers");

router.use(protect);

// HELPERS
const normalizeProjectBudget = (project) => {
  if (!project) return project;

  const p = project.toObject ? project.toObject() : { ...project };

  if (!p.budget) {
    p.budget = { total: 0, material: 0, labour: 0, equipment: 0, misc: 0 };
  } else {
    p.budget.material = Number(p.budget.material || 0);
    p.budget.labour = Number(p.budget.labour || 0);
    p.budget.equipment = Number(p.budget.equipment || 0);
    p.budget.misc = Number(p.budget.misc || 0);
    p.budget.total = Number(p.budget.total || 0);

    if (p.budget.total === 0) {
      p.budget.total =
        p.budget.material +
        p.budget.labour +
        p.budget.equipment +
        p.budget.misc;
    }
  }

  return p;
};

const getProjectSpentAmount = async (projectId) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
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
        },
      },
    ]);

    return result[0]?.totalSpent || 0;
  } catch (e) {
    return 0;
  }
};

const runUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.any()(req, res, (err) => {
      if (err instanceof multer.MulterError) reject(Object.assign(err, { status: 400 }));
      else if (err) reject(Object.assign(err, { status: 400 }));
      else resolve();
    });
  });

const safeParse = (value) => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const mapUiStatusToBackend = (uiStatus) => {
  if (!uiStatus) return "Active";
  const s = uiStatus.toLowerCase().replace(/\s/g, "");
  if (s === "inprogress" || s === "active") return "Active";
  if (s === "onhold") return "On Hold";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "On Hold";
  if (s === "planning") return "Active";
  return "Active";
};

const canAccessProjectFilter = (req, projectId = null) => {
  if (projectId) return { _id: projectId, createdBy: req.user.id };
  return { createdBy: req.user.id };
};

const canManageProjectFilter = (req, projectId = null) => {
  if (projectId) return { _id: projectId, createdBy: req.user.id };
  return { createdBy: req.user.id };
};

const ownedByCurrentUserFilter = (req, projectId = null) => {
  if (projectId) return { _id: projectId, createdBy: req.user.id };
  return { createdBy: req.user.id };
};

// GET MY OWN PROJECTS ONLY
router.get("/mine", requirePermission("view_projects"), async (req, res) => {
  try {
    const projects = await Project.find(ownedByCurrentUserFilter(req)).sort({ createdAt: -1 });

    const normalizedProjects = await Promise.all(
      projects.map(async (p) => {
        const normalized = normalizeProjectBudget(p);
        normalized.spentAmount = await getProjectSpentAmount(p._id);
        return normalized;
      })
    );

    return res.status(200).json({ projects: normalizedProjects });
  } catch (err) {
    console.error("GET /mine error:", err);
    return res.status(500).json({ message: "Failed to fetch your projects" });
  }
});

// GET ALL PROJECTS
router.get("/", requirePermission("view_projects"), async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = canAccessProjectFilter(req);

    if (status && status !== "All") query.status = status;

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { projectName: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { manager: { $regex: search, $options: "i" } },
        ],
      });
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });

    console.log("Authenticated User:", req.user.id);
    console.log("Projects Returned:", projects.length);

    const normalizedProjects = await Promise.all(
      projects.map(async (p) => {
        const normalized = normalizeProjectBudget(p);
        normalized.spentAmount = await getProjectSpentAmount(p._id);
        return normalized;
      })
    );

    res.json({ projects: normalizedProjects });
  } catch (err) {
    console.error("GET projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// GET SINGLE PROJECT
router.get("/:id", requirePermission("view_projects"), async (req, res) => {
  try {
    const project = await Project.findOne(canAccessProjectFilter(req, req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });

    const normalized = normalizeProjectBudget(project);
    normalized.spentAmount = await getProjectSpentAmount(project._id);

    res.json({ project: normalized });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

// GET PROJECT STATS
router.get("/:id/stats", requirePermission("view_projects"), async (req, res) => {
  try {
    const project = await Project.findOne(canAccessProjectFilter(req, req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });

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

// GET PROJECT BUDGET
router.get("/:id/budget", requirePermission("view_projects"), async (req, res) => {
  try {
    const project = await Project.findOne(canAccessProjectFilter(req, req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });

    const projectObjectId = new mongoose.Types.ObjectId(req.params.id);

    const actuals = await Transaction.aggregate([
      { $match: { project: projectObjectId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);

    const actualMap = {};
    actuals.forEach((a) => {
      actualMap[a._id] = a.total;
    });

    const report = {
      materials: {
        budget: project.budget?.material || 0,
        actual: actualMap["Materials"] || 0,
        remaining: (project.budget?.material || 0) - (actualMap["Materials"] || 0),
      },
      labour: {
        budget: project.budget?.labour || 0,
        actual: actualMap["Wages"] || 0,
        remaining: (project.budget?.labour || 0) - (actualMap["Wages"] || 0),
      },
      equipment: {
        budget: project.budget?.equipment || 0,
        actual: actualMap["Equipment"] || actualMap["Expense"] || 0,
        remaining:
          (project.budget?.equipment || 0) -
          ((actualMap["Equipment"] || 0) + 0),
      },
    };

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project budget analysis" });
  }
});

// CREATE PROJECT
router.post("/", requirePermission("manage_team"), async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  try {
    const body = req.body;

    if (!body.projectName || !body.projectName.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const resolvedMaterial = Number(body.budgetMaterials ?? body.budgetMaterial ?? body.budget?.material ?? 0);
    const resolvedLabour = Number(body.budgetLabour ?? body.budget?.labour ?? 0);
    const resolvedEquipment = Number(body.budgetEquipment ?? body.budget?.equipment ?? 0);
    const resolvedMisc = Number(body.budgetMisc ?? body.budget?.misc ?? body.budgetMiscellaneous ?? 0);

    let resolvedTotal = Number(body.totalBudget ?? body.budget?.total ?? 0);
    if (resolvedTotal === 0) {
      resolvedTotal = resolvedMaterial + resolvedLabour + resolvedEquipment + resolvedMisc;
    }

    let safeBuildingType = safeParse(body.buildingType) ?? {
      mainType: "Residential",
      subType: "General",
    };

    if (typeof safeBuildingType === "string") {
      safeBuildingType = { mainType: safeBuildingType, subType: "General" };
    }

    const rawStartDate = body.startDate ?? body.dates?.startDate;
    const rawExpectedEnd = body.expectedEndDate ?? body.dates?.expectedEndDate;
    const parsedStartDate = rawStartDate ? new Date(rawStartDate) : null;
    const parsedExpectedEnd = rawExpectedEnd ? new Date(rawExpectedEnd) : null;

    const uiProjectStatus = body.projectStatus ?? body.status ?? "Planning";
    const backendStatus = mapUiStatusToBackend(uiProjectStatus);
    const parsedFloors = safeParse(body.floors);

    const toIntOrNull = (v) => {
      const n = parseInt(v, 10);
      return isNaN(n) || n < 0 ? null : n;
    };

    const project = await Project.create({
      createdBy: req.user.id,
      projectName: body.projectName.trim(),
      projectCode: body.projectCode || `PRJ-${Date.now()}`,
      clientName: body.clientName || "Internal Client",
      contractorName: body.contractorName || "",
      siteEngineer: body.siteEngineer || body.siteEngineerName || "",
      siteEngineerName: body.siteEngineer || body.siteEngineerName || "",
      contactNumber: body.contactNumber || "",
      mapAddress: body.mapAddress || "",
      location: body.location || body.city || "",
      manager: body.manager || "",
      buildingType: safeBuildingType,
      floors: parsedFloors,
      landArea: body.landArea || null,
      landUnit: body.landUnit || "Sq ft",
      room1BHK: toIntOrNull(body.room1BHK),
      room2BHK: toIntOrNull(body.room2BHK),
      room3BHK: toIntOrNull(body.room3BHK),
      roomCustom: toIntOrNull(body.roomCustom),
      bathWestern: toIntOrNull(body.bathWestern),
      bathIndian: toIntOrNull(body.bathIndian),
      bathCommon: toIntOrNull(body.bathCommon),
      bathAttached: toIntOrNull(body.bathAttached),
      selectedFeatures: safeParse(body.selectedFeatures) || [],
      budget: {
        total: resolvedTotal,
        material: resolvedMaterial,
        labour: resolvedLabour,
        equipment: resolvedEquipment,
        misc: resolvedMisc,
      },
      budgetMaterial: resolvedMaterial,
      budgetLabour: resolvedLabour,
      budgetEquipment: resolvedEquipment,
      budgetMisc: resolvedMisc,
      totalBudget: resolvedTotal,
      startDate: parsedStartDate,
      expectedEndDate: parsedExpectedEnd,
      dates: {
        startDate: parsedStartDate,
        expectedEndDate: parsedExpectedEnd,
      },
      scope: body.scope || "",
      status: backendStatus,
      projectStatus: uiProjectStatus,
      progress: Number(body.progress || 0),
      photo: getFileUrl(req.files?.find((f) => f.fieldname === "photo")) || null,
      selectedPhaseNames: safeParse(body.selectedPhaseNames) || [],
      trackedActivityKeys: safeParse(body.trackedActivityKeys) || [],
      completedActivityKeys: safeParse(body.completedActivityKeys) || [],
      selectedPhases: safeParse(body.selectedPhases) || [],
    });

    const normalized = normalizeProjectBudget(project);
    normalized.spentAmount = await getProjectSpentAmount(project._id);

    res.status(201).json({ message: "Project created", project: normalized });
  } catch (err) {
    console.error("CREATE project error:", err);

    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }

    res.status(500).json({
      message: "Failed to create project",
      err: err.message || err.toString(),
      error: err,
    });
  }
});

// UPDATE PROJECT
router.put("/:id", requirePermission("manage_team"), async (req, res) => {
  try {
    await runUpload(req, res);
  } catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  try {
    const body = req.body;
    const existing = await Project.findOne(canManageProjectFilter(req, req.params.id));
    if (!existing) return res.status(404).json({ message: "Project not found" });

    const updateData = {};

    if (body.projectName !== undefined) updateData.projectName = body.projectName.trim();
    if (body.location !== undefined) updateData.location = body.location;
    if (body.city !== undefined && body.location === undefined) updateData.location = body.city;
    if (body.manager !== undefined) updateData.manager = body.manager;
    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.contractorName !== undefined) updateData.contractorName = body.contractorName;
    if (body.siteEngineer !== undefined) {
      updateData.siteEngineer = body.siteEngineer;
      updateData.siteEngineerName = body.siteEngineer;
    }
    if (body.siteEngineerName !== undefined) {
      updateData.siteEngineerName = body.siteEngineerName;
      updateData.siteEngineer = body.siteEngineerName;
    }
    if (body.contactNumber !== undefined) updateData.contactNumber = body.contactNumber;
    if (body.mapAddress !== undefined) updateData.mapAddress = body.mapAddress;
    if (body.scope !== undefined) updateData.scope = body.scope;
    if (body.progress !== undefined) updateData.progress = Number(body.progress);
    if (body.buildingType !== undefined) updateData.buildingType = safeParse(body.buildingType);
    if (body.floors !== undefined) updateData.floors = safeParse(body.floors);
    if (body.landArea !== undefined) updateData.landArea = body.landArea;
    if (body.landUnit !== undefined) updateData.landUnit = body.landUnit;

    const toIntOrNull = (v) => {
      if (v === undefined) return undefined;
      const n = parseInt(v, 10);
      return isNaN(n) || n < 0 ? null : n;
    };

    const room1 = toIntOrNull(body.room1BHK);
    if (room1 !== undefined) updateData.room1BHK = room1;
    const room2 = toIntOrNull(body.room2BHK);
    if (room2 !== undefined) updateData.room2BHK = room2;
    const room3 = toIntOrNull(body.room3BHK);
    if (room3 !== undefined) updateData.room3BHK = room3;
    const roomC = toIntOrNull(body.roomCustom);
    if (roomC !== undefined) updateData.roomCustom = roomC;
    const bathW = toIntOrNull(body.bathWestern);
    if (bathW !== undefined) updateData.bathWestern = bathW;
    const bathI = toIntOrNull(body.bathIndian);
    if (bathI !== undefined) updateData.bathIndian = bathI;
    const bathCo = toIntOrNull(body.bathCommon);
    if (bathCo !== undefined) updateData.bathCommon = bathCo;
    const bathAt = toIntOrNull(body.bathAttached);
    if (bathAt !== undefined) updateData.bathAttached = bathAt;

    if (body.selectedFeatures !== undefined) {
      updateData.selectedFeatures = safeParse(body.selectedFeatures);
    }

    const inputMaterial =
      body.budgetMaterials !== undefined ? body.budgetMaterials : body.budgetMaterial;
    const inputLabour = body.budgetLabour;
    const inputEquipment = body.budgetEquipment;
    const inputMisc = body.budgetMisc !== undefined ? body.budgetMisc : body.budget?.misc;
    const inputTotal = body.totalBudget !== undefined ? body.totalBudget : body.budget?.total;

    if (
      inputMaterial !== undefined ||
      inputLabour !== undefined ||
      inputEquipment !== undefined ||
      inputMisc !== undefined ||
      inputTotal !== undefined
    ) {
      const eb = existing.budget || {};
      const material = inputMaterial !== undefined ? Number(inputMaterial || 0) : Number(eb.material || 0);
      const labour = inputLabour !== undefined ? Number(inputLabour || 0) : Number(eb.labour || 0);
      const equipment = inputEquipment !== undefined ? Number(inputEquipment || 0) : Number(eb.equipment || 0);
      const misc = inputMisc !== undefined ? Number(inputMisc || 0) : Number(eb.misc || 0);
      let total = inputTotal !== undefined ? Number(inputTotal || 0) : Number(eb.total || 0);

      if (total === 0) total = material + labour + equipment + misc;

      updateData.budget = { total, material, labour, equipment, misc };
      updateData.budgetMaterial = material;
      updateData.budgetLabour = labour;
      updateData.budgetEquipment = equipment;
      updateData.budgetMisc = misc;
      updateData.totalBudget = total;
    }

    const rawStartDate = body.startDate ?? body.dates?.startDate;
    const rawExpectedEnd = body.expectedEndDate ?? body.dates?.expectedEndDate;

    if (rawStartDate !== undefined) {
      const d = rawStartDate ? new Date(rawStartDate) : null;
      updateData.startDate = d;
      updateData["dates.startDate"] = d;
    }

    if (rawExpectedEnd !== undefined) {
      const d = rawExpectedEnd ? new Date(rawExpectedEnd) : null;
      updateData.expectedEndDate = d;
      updateData["dates.expectedEndDate"] = d;
    }

    if (body.projectStatus !== undefined || body.status !== undefined) {
      const uiStatus = body.projectStatus ?? body.status;
      updateData.projectStatus = uiStatus;
      updateData.status = mapUiStatusToBackend(uiStatus);
    }

    if (body.selectedPhaseNames !== undefined) {
      updateData.selectedPhaseNames = safeParse(body.selectedPhaseNames);
    }
    if (body.trackedActivityKeys !== undefined) {
      updateData.trackedActivityKeys = safeParse(body.trackedActivityKeys);
    }
    if (body.completedActivityKeys !== undefined) {
      updateData.completedActivityKeys = safeParse(body.completedActivityKeys);
    }
    if (body.selectedPhases !== undefined) {
      updateData.selectedPhases = safeParse(body.selectedPhases);
    }

    const photoFile = req.files?.find((f) => f.fieldname === "photo");
    if (photoFile) {
      if (existing.photo) await deleteFile(existing.photo);
      updateData.photo = getFileUrl(photoFile);
    } else if (body.removePhoto === "true" || body.removePhoto === true) {
      if (existing?.photo) await deleteFile(existing.photo);
      updateData.photo = null;
    }

    const project = await Project.findOneAndUpdate(
      canManageProjectFilter(req, req.params.id),
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ message: "Project not found" });

    const normalized = normalizeProjectBudget(project);
    normalized.spentAmount = await getProjectSpentAmount(project._id);

    res.json({ message: "Project updated", project: normalized });
  } catch (err) {
    console.error("UPDATE project error:", err);

    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }

    res.status(500).json({ message: "Failed to update project" });
  }
});

// DELETE PROJECT
router.delete("/:id", requirePermission("manage_team"), async (req, res) => {
  try {
    const project = await Project.findOneAndDelete(canManageProjectFilter(req, req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.photo) await deleteFile(project.photo);

    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete project" });
  }
});

module.exports = router;