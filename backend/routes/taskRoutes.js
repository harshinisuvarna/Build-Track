const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/daily", async (req, res) => {
  try {
    let tasks = await Task.find({ createdBy: req.user._id });

    if (tasks.length === 0) {
      // Find user's projects to link the seeded tasks
      const projects = await Project.find({ createdBy: req.user._id });
      
      if (projects.length > 0) {
        const projectId = projects[0]._id;
        const defaultTasks = [
          {
            createdBy: req.user._id,
            project: projectId,
            title: "Foundation Reinforcement checking",
            assignee: "Mohan Singh",
            location: "Ground Floor",
            status: "In Progress",
            time: "09:00 AM",
          },
          {
            createdBy: req.user._id,
            project: projectId,
            title: "Brickwork plastering inspections",
            assignee: "Ravi Teja",
            location: "1st Floor",
            status: "Not Started",
            time: "11:30 AM",
          },
          {
            createdBy: req.user._id,
            project: projectId,
            title: "Concrete slab curing verification",
            assignee: "Pradeep K",
            location: "Ground Floor",
            status: "Completed",
            time: "02:00 PM",
          }
        ];
        
        tasks = await Task.insertMany(defaultTasks);
      }
    }

    res.json(tasks);
  } catch (err) {
    console.error("Fetch daily tasks error:", err);
    res.status(500).json({ message: "Failed to fetch daily tasks" });
  }
});

module.exports = router;
