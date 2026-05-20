const express       = require("express");
const router        = express.Router();
const Transaction   = require("../models/Transaction");
const Worker        = require("../models/Worker");
const Project       = require("../models/Project");
const Inventory     = require("../models/Inventory");
const { protect }   = require("../middleware/auth");
const upload        = require("../config/multer");
const { getFileUrl } = require("../config/fileHelpers");
const mongoose      = require("mongoose");

router.use(protect);

const parseId = (id) => mongoose.Types.ObjectId.isValid(id) ? id : null;

async function resolveIds(userId, { worker, project }) {
  let workerId  = parseId(worker);
  let projectId = parseId(project);
  if (!workerId && worker) {
    const wDoc = await Worker.findOne({ createdBy: userId, name: String(worker).trim() }).lean();
    workerId = wDoc?._id || null;
  }
  if (!projectId && project) {
    const pDoc = await Project.findOne({ createdBy: userId, projectName: String(project).trim() }).lean();
    projectId = pDoc?._id || null;
  }
  return { workerId, projectId };
}

// GET all transactions (optionally filtered by project)
router.get("/", async (req, res) => {
  try {
    const { project } = req.query;
    const query = { createdBy: req.user._id };
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      query.project = project;
    }
    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).lean();
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { materialName, purchased, unit, project, threshold } = req.body;
    if (!materialName || !project) {
      return res.status(400).json({ message: "materialName and project are required" });
    }

    let item = await Inventory.findOne({ project, materialName, createdBy: req.user._id });
    if (item) {
      // Already exists — top up
      item.purchased += parseFloat(purchased) || 0;
      item.closingStock = item.purchased - item.used;
    } else {
      // New item
      item = new Inventory({
        materialName,
        purchased: parseFloat(purchased) || 0,
        used: 0,
        closingStock: parseFloat(purchased) || 0,
        unit: unit || 'units',
        threshold: parseFloat(threshold) || 10,
        project,
        createdBy: req.user._id,
      });
    }
    await item.save();
    res.json({ message: "Inventory updated", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to add to inventory" });
  }
});
// 🌟 THE FIX: 'next' is included in the signature
router.post("/", upload.array("attachments"), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { title, type, worker, project, category, subType, unit, quantity, rate } = req.body;

    if (!title || !type) return res.status(400).json({ message: "Title and Type are required" });
    
    const { workerId, projectId } = await resolveIds(req.user._id, { worker, project });
    if (!projectId) return res.status(400).json({ message: "Valid project required" });

    const transaction = new Transaction({
      createdBy: req.user._id,
      title, type, worker: workerId, project: projectId, category, subType, unit, quantity, rate,
      amount: Number(quantity) * Number(rate)
    });
    
    await transaction.save({ session });
    await session.commitTransaction();
    res.status(201).json({ message: "Saved", transaction });
  } catch (err) {
    await session.abortTransaction();
    // 🌟 This will now work because 'next' is defined above
    next(err); 
  } finally {
    session.endSession();
  }
});

// PUT update transaction payment details
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await Transaction.findOne({ _id: id, createdBy: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const { paymentStatus, paidAmount, paymentMode, notes } = req.body;

    if (paidAmount !== undefined) {
      const prevPaid = transaction.paidAmount || 0;
      const diff = Number(paidAmount) - prevPaid;
      if (diff > 0) {
        transaction.paymentHistory.push({
          date: new Date(),
          method: paymentMode || "Cash",
          amount: diff,
          note: notes || "",
        });
      }
      transaction.paidAmount = Number(paidAmount);
    }

    if (paymentStatus !== undefined) transaction.paymentStatus = paymentStatus;
    if (paymentMode !== undefined) transaction.paymentMode = paymentMode;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    res.json({ message: "Transaction payment updated successfully", transaction });
  } catch (err) {
    next(err);
  }
});

module.exports = router;