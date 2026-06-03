const Project = require("../models/Project");

const getProjectConfig = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({
      _id: projectId,
      createdBy: req.user._id,
    }).select("selectedPhases completedActivityKeys");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const phases = project.selectedPhases || [];
    const completedKeys = project.completedActivityKeys || [];
    const hasCustomConfig = Array.isArray(project.selectedPhases) && project.selectedPhases.length > 0;

    return res.status(200).json({
      hasCustomConfig,
      phases,
      completedKeys,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getProjectConfig,
};
