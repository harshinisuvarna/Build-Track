const express       = require("express");
const router        = express.Router();
const Transaction   = require("../models/Transaction");
const Worker        = require("../models/Worker");
const Project       = require("../models/Project");
const { protect }   = require("../middleware/auth");
const mongoose      = require("mongoose");
router.use(protect);
router.get("/", async (req, res) => {
  try {
    const { type, search } = req.query;
    const query = { createdBy: req.user._id };

    if (type && type !== "All") query.type = type;

    if (search) {
      query.$or = [
        { title:   { $regex: search, $options: "i" } },
        { notes:   { $regex: search, $options: "i" } },
      ];
    }
    const transactions = await Transaction.find(query)
      .populate("worker", "name")
      .populate("project", "projectName")
      .sort({ date: -1, createdAt: -1 });
    res.json({ transactions });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});
router.post("/", async (req, res) => {
  try {
    const { title, amount, type, worker, project, date, notes } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!amount || isNaN(Number(amount)))
      return res.status(400).json({ message: "Valid amount is required" });
    if (!type)
      return res.status(400).json({ message: "Transaction type is required" });
    if (type === "Wages" && (!worker || !String(worker).trim()))
      return res.status(400).json({ message: "Worker is required for Wages entries" });
    const parseOptionalObjectId = (value) => {
      if (value === undefined || value === null || value === "") return null;
      return mongoose.Types.ObjectId.isValid(value) ? value : null;
    };
    let workerId = parseOptionalObjectId(worker);
    let projectId = parseOptionalObjectId(project);
    if (!workerId && worker) {
      const workerDoc = await Worker.findOne({
        createdBy: req.user._id,
        name: String(worker).trim(),
      }).select("_id");
      workerId = workerDoc?._id || null;
    }
    if (!projectId && project) {
      const projectDoc = await Project.findOne({
        createdBy: req.user._id,
        projectName: String(project).trim(),
      }).select("_id");
      projectId = projectDoc?._id || null;
    }
    if (worker && !workerId) {
      return res.status(400).json({ message: "Invalid worker. Please select a valid worker from the dropdown." });
    }
    if (project && !projectId) {
      return res.status(400).json({ message: "Invalid project. Please select a valid project from the dropdown." });
    }
    const transaction = await Transaction.create({
      createdBy: req.user._id,
      title:     title.trim(),
      amount:    Number(amount),
      type,
      worker:    workerId,
      project:   projectId,
      date:      date    || new Date(),
      notes:     notes   || "",
    });
    res.status(201).json({ message: "Transaction saved", transaction });
  } catch (err) {
    console.error("Create transaction error:", err);
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(", ");
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: "Failed to save transaction" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});
module.exports = router;
