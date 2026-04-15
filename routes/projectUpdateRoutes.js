const express = require("express");
const router = express.Router();
const ProjectUpdate = require("../models/ProjectUpdate");
const Project = require("../models/Project");
const { protect } = require("../middleware/auth");
const upload = require("../config/multer");
const { getFileUrl } = require("../config/fileHelpers");

router.use(protect);

// GET /api/project-updates/:projectId - Get all updates for a specific project
router.get("/:projectId", async (req, res) => {
  try {
    const updates = await ProjectUpdate.find({
      project: req.params.projectId,
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project updates" });
  }
});

function calculateProgress(stage) {
  const stageMap = {
    "Foundation": 10,
    "Footing": 20,
    "Walls": 40,
    "Slab": 60,
    "First Floor": 70,
    "Second Floor": 80,
    "Finishing": 100
  };
  return stageMap[stage] || 0;
}

// POST /api/project-updates - Create a new project update
router.post("/", upload.array("media"), async (req, res) => {
  try {
    const { project, stage, workDone, startDate, endDate, remarks } = req.body;

    if (!project || !stage) {
      return res.status(400).json({ message: "Project and Stage are required" });
    }

    const media = req.files ? req.files.map((f) => getFileUrl(f)) : [];

    const update = await ProjectUpdate.create({
      createdBy: req.user._id,
      project,
      stage,
      workDone: Number(workDone) || 0,
      startDate,
      endDate,
      remarks,
      media,
    });

    // Auto-update project progress
    const progressVal = calculateProgress(stage);
    if (progressVal > 0) {
      const existing = await Project.findById(project);
      if (existing && progressVal > (existing.progress || 0)) {
        await Project.findByIdAndUpdate(project, { progress: progressVal });
      }
    }

    res.status(201).json({ message: "Project update saved", update });
  } catch (err) {
    console.error("Create project update error:", err);
    res.status(500).json({ message: "Failed to save project update" });
  }
});

module.exports = router;
