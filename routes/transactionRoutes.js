const express       = require("express");
const router        = express.Router();
const Transaction   = require("../models/Transaction");
const Worker        = require("../models/Worker");
const Project       = require("../models/Project");
const Inventory     = require("../models/Inventory");
const { protect }   = require("../middleware/auth");
const upload        = require("../config/multer");
const { getFileUrl, deleteFile } = require("../config/fileHelpers");
const mongoose      = require("mongoose");

router.use(protect);

// ─── helpers ─────────────────────────────────────────────────────────────────

const parseId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? id : null;

/** Resolve worker/project by ObjectId OR by name string */
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

/** Apply inventory delta (atomic, inside a session) */
async function applyInventoryDelta(userId, projectId, category, unit, delta, session) {
  if (!delta || !category || !projectId) return;

  if (delta > 0) {
    // Purchase: upsert
    await Inventory.updateOne(
      { createdBy: userId, project: projectId, materialName: category },
      {
        $inc: { purchased: delta, closingStock: delta },
        $setOnInsert: { unit: unit || "" },
      },
      { upsert: true, session }
    );
  } else if (delta < 0) {
    // Consumption: stock must exist and be sufficient
    const absQty = Math.abs(delta);
    const inv = await Inventory.findOne(
      { createdBy: userId, project: projectId, materialName: category },
      null,
      { session }
    );
    if (!inv) throw Object.assign(new Error("No stock found for this material"), { status: 400 });
    if (inv.closingStock < absQty) throw Object.assign(new Error("Insufficient stock"), { status: 400 });

    await Inventory.updateOne(
      { _id: inv._id },
      { $inc: { used: absQty, closingStock: -absQty } },
      { session }
    );
  }
}

// ─── GET /api/transactions ────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const { type, search, category, project, startDate, endDate } = req.query;
    const query = { createdBy: req.user._id };

    if (type && type !== "All")   query.type     = type;
    if (category)                 query.category = category;
    if (project)                  query.project  = project;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await Transaction.find(query)
      .populate("worker",  "name")
      .populate("project", "projectName")
      .sort({ date: -1, createdAt: -1 });

    res.json({ transactions });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// ─── GET /api/transactions/:id ────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate("worker",  "name")
      .populate("project", "projectName");
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    res.json({ transaction: tx });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transaction" });
  }
});

// ─── POST /api/transactions ───────────────────────────────────────────────────

router.post("/", upload.array("attachments"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      title, type, worker, project, date, notes,
      category, brand, subType, unit, quantity, rate,
      paymentStatus, paymentMode, paymentDate, paidAmount, remarks,
    } = req.body;

    // 1. Basic validations
    if (!title || !title.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!type)
      return res.status(400).json({ message: "Transaction type is required" });
    if (type === "Wages" && !worker)
      return res.status(400).json({ message: "Worker is required for Wages" });
    if (type === "Materials" && !category)
      return res.status(400).json({ message: "Category is required for Materials" });

    // 2. Resolve IDs
    const { workerId, projectId } = await resolveIds(req.user._id, { worker, project });
    if (!projectId)
      return res.status(400).json({ message: "Valid project is required" });

    // 3. Files
    const attachments = req.files ? req.files.map((f) => getFileUrl(f)) : [];

    // 4. Numeric handling
    const qty    = Number(quantity)   || 0;
    const rt     = Number(rate)       || 0;
    const paidAmt = Number(paidAmount) || 0;

    if (qty < 0 || rt < 0)
      return res.status(400).json({ message: "Quantity and Rate must be >= 0" });
    if (paidAmt > qty * rt)
      return res.status(400).json({ message: "Paid amount cannot exceed total" });

    // 5. Create transaction (session)
    const transaction = new Transaction({
      createdBy:     req.user._id,
      title:         title.trim(),
      type,
      worker:        workerId,
      project:       projectId,
      date:          date || new Date(),
      notes,
      category,
      brand,
      subType,
      unit:          unit || "unit",
      quantity:      qty,
      rate:          rt,
      paymentStatus: paymentStatus || "Pending",
      paymentMode:   paymentMode   || "Cash",
      paymentDate,
      paidAmount:    paidAmt,
      remarks,
      attachments,
      amount:        qty * rt,
    });
    await transaction.save({ session });

    // 6. Inventory auto-update (atomic, same session)
    if (type === "Materials" && qty > 0) {
      const inventoryDelta = subType === "Consumption" ? -qty : qty;
      await applyInventoryDelta(req.user._id, projectId, category, unit, inventoryDelta, session);
    }

    await session.commitTransaction();
    res.status(201).json({ message: "Transaction saved", transaction });
  } catch (err) {
    await session.abortTransaction();
    console.error("Create transaction error:", err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Failed to save transaction" });
  } finally {
    session.endSession();
  }
});

// ─── PUT /api/transactions/:id ────────────────────────────────────────────────

router.put("/:id", upload.array("attachments"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne(
      { _id: req.params.id, createdBy: req.user._id },
      null,
      { session }
    );
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    const {
      title, type, worker, project, date, notes,
      category, brand, subType, unit, quantity, rate,
      paymentStatus, paymentMode, paymentDate, paidAmount, remarks,
    } = req.body;

    // 1. Validations
    if (title !== undefined && !String(title).trim())
      return res.status(400).json({ message: "Title cannot be empty" });
    if (type && !["Wages", "Expense", "Income", "Materials"].includes(type))
      return res.status(400).json({ message: "Invalid transaction type" });

    // 2. Resolve IDs
    const { workerId, projectId } = await resolveIds(req.user._id, {
      worker:  worker  ?? tx.worker,
      project: project ?? tx.project,
    });
    if (!projectId)
      return res.status(400).json({ message: "Valid project is required" });

    // 3. Numeric
    const newQty    = quantity  !== undefined ? Number(quantity)   : tx.quantity;
    const newRt     = rate      !== undefined ? Number(rate)       : tx.rate;
    const newPaidAmt = paidAmount !== undefined ? Number(paidAmount) : tx.paidAmount;
    const newType    = type     || tx.type;
    const newSubType = subType  !== undefined ? subType : tx.subType;
    const newCat     = category || tx.category;

    if (newQty < 0 || newRt < 0)
      return res.status(400).json({ message: "Quantity and Rate must be >= 0" });
    if (newPaidAmt > newQty * newRt)
      return res.status(400).json({ message: "Paid amount cannot exceed total" });

    // 4. Reconcile inventory: undo old effect, apply new effect
    if (tx.type === "Materials" && tx.quantity > 0) {
      const oldDelta = tx.subType === "Consumption" ? tx.quantity : -tx.quantity; // reverse
      await applyInventoryDelta(req.user._id, tx.project, tx.category, tx.unit, oldDelta, session);
    }
    if (newType === "Materials" && newQty > 0) {
      const newDelta = newSubType === "Consumption" ? -newQty : newQty;
      await applyInventoryDelta(req.user._id, projectId, newCat, unit || tx.unit, newDelta, session);
    }

    // 5. Handle new attachments
    let updatedAttachments = tx.attachments;
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((f) => getFileUrl(f));
      updatedAttachments = [...updatedAttachments, ...newFiles];
    }

    // 6. Apply updates
    if (title         !== undefined) tx.title         = title.trim();
    if (type          !== undefined) tx.type          = type;
    if (worker        !== undefined) tx.worker        = workerId;
    if (project       !== undefined) tx.project       = projectId;
    if (date          !== undefined) tx.date          = date;
    if (notes         !== undefined) tx.notes         = notes;
    if (category      !== undefined) tx.category      = category;
    if (brand         !== undefined) tx.brand         = brand;
    if (subType       !== undefined) tx.subType       = subType;
    if (unit          !== undefined) tx.unit          = unit;
    if (quantity      !== undefined) tx.quantity      = newQty;
    if (rate          !== undefined) tx.rate          = newRt;
    if (paymentStatus !== undefined) tx.paymentStatus = paymentStatus;
    if (paymentMode   !== undefined) tx.paymentMode   = paymentMode;
    if (paymentDate   !== undefined) tx.paymentDate   = paymentDate;
    if (paidAmount    !== undefined) tx.paidAmount    = newPaidAmt;
    if (remarks       !== undefined) tx.remarks       = remarks;
    tx.attachments = updatedAttachments;
    tx.amount = newQty * newRt;

    await tx.save({ session });
    await session.commitTransaction();

    res.json({ message: "Transaction updated", transaction: tx });
  } catch (err) {
    await session.abortTransaction();
    console.error("Update transaction error:", err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Failed to update transaction" });
  } finally {
    session.endSession();
  }
});

// ─── DELETE /api/transactions/:id ─────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOneAndDelete(
      { _id: req.params.id, createdBy: req.user._id },
      { session }
    );
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Reverse inventory effect
    if (tx.type === "Materials" && tx.quantity > 0) {
      const reverseDelta = tx.subType === "Consumption" ? tx.quantity : -tx.quantity;
      await applyInventoryDelta(
        req.user._id, tx.project, tx.category, tx.unit, reverseDelta, session
      );
    }

    await session.commitTransaction();

    // Delete attachments after commit (non-critical, outside session)
    if (Array.isArray(tx.attachments)) {
      for (const url of tx.attachments) {
        await deleteFile(url).catch(() => {});
      }
    }

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    await session.abortTransaction();
    console.error("Delete transaction error:", err);
    res.status(500).json({ message: "Failed to delete transaction" });
  } finally {
    session.endSession();
  }
});

module.exports = router;
