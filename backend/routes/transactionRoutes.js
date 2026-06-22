const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const multer = require("multer");

const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const Project = require("../models/Project");
const Inventory = require("../models/Inventory");

const { protect, requirePermission, getAdminId, canAccessProjectFilter } = require("../middleware/auth");

const upload = require("../config/multer");

const {
  getFileUrl,
  deleteFile,
} = require("../config/fileHelpers");

router.use(protect);

/// =======================================================
/// HELPERS
/// =======================================================

const parseId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? id : null;

const normalizeMaterialType = (materialType, subType) => {
  if (materialType === "purchase" || materialType === "usage") {
    return materialType;
  }
  if (subType === "Consumption") return "usage";
  return "purchase";
};

const parseAmount = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const cleaned = String(value).replace(/[₹,\s]/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};

const calculateAmount = ({ type, quantity, rate, rawAmount }) => {
  const qty = Number(quantity) || 0;
  const rt = Number(rate) || 0;
  const directAmount = Number(rawAmount) || 0;
  if (type === "Materials") return qty * rt;
  if (directAmount > 0) return directAmount;
  return qty * rt;
};

/// =======================================================
/// FILE UPLOADS
/// =======================================================

const runTransactionCreateUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.fields([
      { name: "attachments", maxCount: 5 },
      { name: "paymentScreenshot", maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) return reject(Object.assign(err, { status: 400 }));
      if (err) return reject(Object.assign(err, { status: 400 }));
      resolve();
    });
  });

const runTransactionUpdateUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.array("attachments")(req, res, (err) => {
      if (err instanceof multer.MulterError) return reject(Object.assign(err, { status: 400 }));
      if (err) return reject(Object.assign(err, { status: 400 }));
      resolve();
    });
  });

/// =======================================================
/// RESOLVE IDS
/// =======================================================

async function resolveIds(userId, { worker, project }) {
  let workerId = parseId(worker);
  let projectId = parseId(project);

  if (workerId) {
    const wDoc = await Worker.findOne({ _id: workerId, createdBy: userId }).lean();
    if (!wDoc) workerId = null;
  } else if (worker) {
    const wDoc = await Worker.findOne({ createdBy: userId, name: String(worker).trim() }).lean();
    workerId = wDoc?._id || null;
  }

  if (projectId) {
    const pDoc = await Project.findOne({ _id: projectId, createdBy: userId }).lean();
    if (!pDoc) projectId = null;
  } else if (project) {
    const pDoc = await Project.findOne({ createdBy: userId, projectName: String(project).trim() }).lean();
    projectId = pDoc?._id || null;
  }

  return { workerId, projectId };
}

/// =======================================================
/// INVENTORY DELTA
/// FIX: scope by { createdBy, project, materialName }
/// so the same material can exist in multiple projects
/// without hitting the unique index.
/// =======================================================

async function applyInventoryDelta(
  adminId,      // always the organisation's admin _id (from getAdminId)
  projectId,    // the specific project this entry belongs to
  category,
  unit,
  delta,
  session
) {
  if (!delta || !category || !projectId) return;

  // ── PURCHASE (delta > 0) ─────────────────────────────────────────────────
  if (delta > 0) {
    await Inventory.updateOne(
      {
        createdBy: adminId,
        project: projectId,       // FIX: include project in filter
        materialName: category,
      },
      {
        $inc: {
          purchased: delta,
          closingStock: delta,
        },
        $setOnInsert: {
          unit: unit || "",
        },
      },
      {
        upsert: true,
        session,
      }
    );
  }

  // ── USAGE (delta < 0) ────────────────────────────────────────────────────
  else if (delta < 0) {
    const absQty = Math.abs(delta);

    const inv = await Inventory.findOne(
      {
        createdBy: adminId,
        project: projectId,       // FIX: include project in filter
        materialName: category,
      },
      null,
      { session }
    );

    if (!inv) {
      throw Object.assign(
        new Error("No stock found for this material in this project"),
        { status: 400 }
      );
    }

    if (inv.closingStock < absQty) {
      throw Object.assign(
        new Error(`Insufficient stock — only ${inv.closingStock} ${inv.unit || "units"} available`),
        { status: 400 }
      );
    }

    await Inventory.updateOne(
      { _id: inv._id },
      {
        $inc: {
          used: absQty,
          closingStock: -absQty,
        },
      },
      { session }
    );
  }
}

/// =======================================================
/// GET ALL TRANSACTIONS
/// FIX: honour optional ?createdBy= query param so the
/// mobile app can fetch only a specific user's entries
/// (used for "Recent Entries" and autocomplete suggestions).
/// =======================================================

router.get("/", async (req, res) => {
  try {
    const {
      type,
      search,
      category,
      project,
      startDate,
      endDate,
      // FIX: new optional query param — scopes results to a specific user
      createdBy: queryCreatedBy,
    } = req.query;

    const query = {};

    if (req.user.role !== "Admin") {
      // Non-admin: scope to assigned projects
      const projectFilter = canAccessProjectFilter(req);
      const projects = await Project.find(projectFilter).select("_id");
      const projectIds = projects.map((p) => p._id);
      query.project = { $in: projectIds };
    } else {
      // Admin: scope to their own transactions
      query.createdBy = req.user._id;
    }

    // ── FIX: if caller passes ?createdBy=<userId>, further filter by that
    // user's entries within the already-scoped result set.
    // This is safe — non-admins are already scoped to assigned projects above,
    // so passing createdBy only narrows the result, never broadens it.
    if (queryCreatedBy && mongoose.Types.ObjectId.isValid(queryCreatedBy)) {
      query.createdBy = new mongoose.Types.ObjectId(queryCreatedBy);
    }

    if (type && type !== "All") query.type = type;
    if (category) query.category = category;

    if (project) {
      const pDoc = await Project.findOne(canAccessProjectFilter(req, project));
      if (!pDoc) {
        return res.status(403).json({ message: "Access denied to this project" });
      }
      query.project = project;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // ── Optional limit param (used by mobile "recent entries" fetch) ─────────
    const limitParam = req.query.limit ? parseInt(req.query.limit, 10) : 0;

    let txQuery = Transaction.find(query)
      .populate("worker", "name trade")
      .populate("project", "projectName status progress")
      .sort({ date: -1, createdAt: -1 });

    if (limitParam > 0) txQuery = txQuery.limit(limitParam);

    const transactions = await txQuery;

    res.json({ transactions });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

/// =======================================================
/// GET SINGLE TRANSACTION
/// =======================================================

router.get("/:id", async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate("worker", "name trade")
      .populate("project", "projectName status progress createdBy");

    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (req.user.role !== "Admin") {
      const assignedIds = Array.isArray(req.user.projectIds)
        ? req.user.projectIds.filter(Boolean).map((id) => id.toString())
        : [];
      const legacyId = req.user.projectId ? req.user.projectId.toString() : null;
      const allAssigned = legacyId && !assignedIds.includes(legacyId)
        ? [...assignedIds, legacyId]
        : assignedIds;

      if (!tx.project || !allAssigned.includes(tx.project._id.toString())) {
        return res.status(403).json({ message: "Access denied to this transaction" });
      }
    } else {
      if (tx.project && tx.project.createdBy.toString() !== req.user._id.toString()) {
        if (tx.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "Access denied to this transaction" });
        }
      }
    }

    res.json({ transaction: tx });
  } catch (err) {
    console.error("Get transaction error:", err);
    res.status(500).json({ message: "Failed to fetch transaction" });
  }
});

/// =======================================================
/// CREATE TRANSACTION
/// =======================================================

router.post("/", requirePermission(["manage_expenses", "add_entries"]), async (req, res) => {
  try {
    await runTransactionCreateUpload(
      req,
      res
    );
  } catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  const { paymentStatus, paidAmount } = req.body;
  const userPermissions = req.user.permissions || [];
  const canMarkPaid =
    req.user.role === "Admin" ||
    userPermissions.includes("approve_payments") ||
    userPermissions.includes("mark_paid");

  if ((paymentStatus === "Paid" || Number(paidAmount) > 0) && !canMarkPaid) {
    return res.status(403).json({
      message: "Insufficient permissions to record payments or mark as Paid",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title, type, worker, project, date, notes,
      category, brand, subType, unit, quantity, rate,
      materialType,
      paymentStatus: _paymentStatus,
      paymentMode, paymentDate, paidAmount: _paidAmount,
      remarks,
      amount: rawAmount,
      floor,
      floorId,
      phase,
      phaseId,
      activity,
      activityId,
      supplier,
      gst,
      isWithGst,
    } = req.body;

    const txApprovalStatus = req.user.role === "Admin" ? "Approved" : "Pending";
console.log(`[Transaction] Creating transaction - user role: ${req.user.role}, approvalStatus: ${txApprovalStatus}, createdBy: ${req.user._id}`);
    const approvedBy = req.user.role === "Admin" ? req.user._id : null;
    const approvedAt = req.user.role === "Admin" ? new Date() : null;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!type) {
      return res.status(400).json({ message: "Transaction type is required" });
    }

    const resolvedCategory =
      category || (type === "Materials" ? title.trim() : undefined);

    const normalizedMaterialType =
      type === "Materials" ? normalizeMaterialType(materialType, subType) : "";

    // FIX: resolveIds uses admin's _id for project lookup since non-admin
    // users don't own the project themselves. Use getAdminId for consistency.
    const adminId = await getAdminId(req.user);

    // For project lookup: non-admins are assigned to projects they don't own,
    // so we look up by _id directly (canAccessProjectFilter already validated access).
    let workerId = parseId(worker);
    let projectId = parseId(project);

    if (workerId) {
      const wDoc = await Worker.findOne({ _id: workerId, createdBy: adminId }).lean();
      if (!wDoc) workerId = null;
    } else if (worker) {
      const wDoc = await Worker.findOne({ createdBy: adminId, name: String(worker).trim() }).lean();
      workerId = wDoc?._id || null;
    }

    if (projectId) {
      // Validate this user can access this project
      const pDoc = await Project.findOne(canAccessProjectFilter(req, projectId));
      if (!pDoc) projectId = null;
    }

    const attachmentFiles = (req.files?.attachments || []).map(getFileUrl);
    const screenshotFile = req.files?.paymentScreenshot?.[0];
    const screenshotUrl = screenshotFile ? getFileUrl(screenshotFile) : null;

    const qty = Number(quantity) || 0;
    const rt = Number(rate) || 0;
    const paidAmt = parseAmount(_paidAmount);

    if (qty < 0 || rt < 0) {
      return res.status(400).json({ message: "Quantity and rate must be positive" });
    }

    const finalAmount = calculateAmount({ type, quantity: qty, rate: rt, rawAmount });

      const transaction =
        new Transaction({
          createdBy: req.user._id,

          title: title.trim(),

          type,

          worker:
            workerId || null,

          project:
            projectId || null,

          date:
            date || new Date(),

          notes,

          category:
            resolvedCategory,

          brand,

          supplier,

          gst,
          isWithGst,

          subType,

          materialType:
            normalizedMaterialType,

          unit:
            unit || "unit",

          quantity: qty,

          rate: rt,

          amount: finalAmount,

          floor,
          floorId,
          phase,
          phaseId,
          activity,
          activityId,

          paymentStatus:
            paymentStatus ||
            "Pending",

          paymentMode:
            paymentMode || "Cash",

          paymentDate,

          paidAmount: paidAmt,

          remarks,

          attachments:
            attachmentFiles,

          screenshotUrl,
          
          approvalStatus: txApprovalStatus,
          approvedBy: approvedBy,
          approvedAt: approvedAt,
        });

    await transaction.save({ session });

    // FIX: pass adminId (org admin) AND projectId to applyInventoryDelta
    // so inventory is scoped to { adminId, projectId, materialName }
    if (type === "Materials" && qty > 0 && projectId && txApprovalStatus === "Approved") {
      const inventoryDelta =
        normalizedMaterialType === "usage" ? -qty : qty;

      await applyInventoryDelta(
        adminId,      // organisation's admin (owns inventory records)
        projectId,    // FIX: scope inventory to this specific project
        resolvedCategory,
        unit,
        inventoryDelta,
        session
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      message: "Transaction saved successfully",
      transaction,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Create transaction error:", err);
    let status = err.status || 500;
    if (err.name === "ValidationError") status = 400;
    else if (err.name === "VersionError") status = 409;
    res.status(status).json({
      message: err.message || "Failed to save transaction",
    });
  } finally {
    session.endSession();
  }
});

/// =======================================================
/// UPDATE TRANSACTION
/// =======================================================

router.put("/:id", async (req, res) => {
  try {
    await runTransactionUpdateUpload(
      req,
      res
    );
  } catch (uploadErr) {
    return res.status(400).json({ message: uploadErr.message || "File upload error" });
  }

  console.log('=== UPDATE TRANSACTION REQUEST ===');
  console.log('ID:', req.params.id);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const { paymentStatus, paidAmount } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (req.user.role !== "Admin") {
      const assignedIds = Array.isArray(req.user.projectIds)
        ? req.user.projectIds.filter(Boolean).map((id) => id.toString())
        : [];
      const legacyId = req.user.projectId ? req.user.projectId.toString() : null;
      const allAssigned = legacyId && !assignedIds.includes(legacyId)
        ? [...assignedIds, legacyId]
        : assignedIds;

      if (!tx.project || !allAssigned.includes(tx.project.toString())) {
        return res.status(403).json({ message: "Access denied to this transaction" });
      }
    } else {
      if (tx.project) {
        const pDoc = await Project.findById(tx.project).session(session);
        if (pDoc && pDoc.createdBy.toString() !== req.user._id.toString()) {
          if (tx.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied to this transaction" });
          }
        }
      }
    }

    const userPermissions = req.user.permissions || [];
    const canMarkPaid =
      req.user.role === "Admin" ||
      userPermissions.includes("approve_payments") ||
      userPermissions.includes("mark_paid");

    if ((paymentStatus === "Paid" || paidAmount !== undefined) && !canMarkPaid) {
      if (paymentStatus === "Paid" || (paidAmount !== undefined && Number(paidAmount) !== tx.paidAmount)) {
        return res.status(403).json({
          message: "Insufficient permissions to record payments or mark as Paid",
        });
      }
    }

    const {
      title, type, worker, project, date, notes,
      category, brand, subType, unit, quantity, rate,
      materialType,
      paymentStatus: _paymentStatus, paymentMode, paymentDate,
      paidAmount: _paidAmount,
      remarks,
      amount: rawAmount,
      floor,
      floorId,
      phase,
      phaseId,
      activity,
      activityId,
      supplier,
      gst,
      isWithGst,
    } = req.body;

    const adminId = await getAdminId(req.user);

    let workerId = parseId(worker ?? tx.worker);
    let projectId = parseId(project ?? tx.project);

    if (workerId) {
      const wDoc = await Worker.findOne({ _id: workerId, createdBy: adminId }).lean();
      if (!wDoc) workerId = null;
    }
    if (projectId) {
      const pDoc = await Project.findOne(canAccessProjectFilter(req, projectId));
      if (!pDoc) projectId = null;
    }

    const newQty = quantity !== undefined ? Number(quantity) : tx.quantity;
    const newRt = rate !== undefined ? Number(rate) : tx.rate;
    const finalAmount = calculateAmount({
      type: type || tx.type,
      quantity: newQty,
      rate: newRt,
      rawAmount: rawAmount ?? tx.amount,
    });

    // Reverse old inventory (using old project scope)
    if (tx.type === "Materials" && tx.quantity > 0 && tx.approvalStatus === "Approved") {
      const oldType = normalizeMaterialType(tx.materialType, tx.subType);
      const reverseDelta = oldType === "usage" ? tx.quantity : -tx.quantity;
      await applyInventoryDelta(
        adminId,
        tx.project,   // use the OLD project for reversal
        tx.category,
        tx.unit,
        reverseDelta,
        session
      );
    }

    // Apply new inventory (using new project scope)
    const newType = type || tx.type;
    const newMaterialType = newType === "Materials"
      ? normalizeMaterialType(materialType || tx.materialType, subType || tx.subType)
      : "";

    if (newType === "Materials" && newQty > 0 && projectId && tx.approvalStatus === "Approved") {
      const newDelta = newMaterialType === "usage" ? -newQty : newQty;
      await applyInventoryDelta(
        adminId,
        projectId,    // use the NEW project for application
        category || tx.category,
        unit || tx.unit,
        newDelta,
        session
      );
    }

    let updatedAttachments = tx.attachments || [];
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((f) => getFileUrl(f));
      updatedAttachments = [...updatedAttachments, ...newFiles];
    }

    if (title !== undefined)
      tx.title = title.trim();

    if (type !== undefined)
      tx.type = type;

    if (worker !== undefined)
      tx.worker = workerId;

    if (project !== undefined)
      tx.project = projectId;

    if (date !== undefined)
      tx.date = date;

    if (notes !== undefined)
      tx.notes = notes;

    if (category !== undefined)
      tx.category = category;

    if (brand !== undefined)
      tx.brand = brand;

    if (supplier !== undefined)
      tx.supplier = supplier;

    if (gst !== undefined)
      tx.gst = gst;

    if (isWithGst !== undefined)
      tx.isWithGst = isWithGst;

    if (subType !== undefined)
      tx.subType = subType;

    if (unit !== undefined)
      tx.unit = unit;

    if (quantity !== undefined)
      tx.quantity = newQty;

    if (rate !== undefined)
      tx.rate = newRt;

    if (
      materialType !==
      undefined ||
      subType !== undefined
    ) {
      tx.materialType =
        newMaterialType;
    }

    if (
      paymentStatus !==
      undefined
    ) {
      tx.paymentStatus =
        paymentStatus;
    }

    if (
      paymentMode !== undefined
    ) {
      tx.paymentMode =
        paymentMode;
    }

    if (
      paymentDate !== undefined
    ) {
      tx.paymentDate =
        paymentDate;
    }

    if (_paidAmount !== undefined) {
      const newPaidAmount = parseAmount(_paidAmount);
      const delta = newPaidAmount - tx.paidAmount;
      if (delta > 0) {
        tx.paymentHistory.push({
          date: paymentDate || new Date(),
          method: paymentMode || tx.paymentMode || "Cash",
          amount: delta,
          note: remarks || notes || "Additional payment",
        });
      }
      tx.paidAmount = newPaidAmount;
    }

    if (remarks !== undefined)  tx.remarks     = remarks;
    if (floor !== undefined)    tx.floor       = floor;
    if (floorId !== undefined)  tx.floorId     = floorId;
    if (phase !== undefined)    tx.phase       = phase;
    if (phaseId !== undefined)  tx.phaseId     = phaseId;
    if (activity !== undefined) tx.activity    = activity;
    if (activityId !== undefined) tx.activityId = activityId;
    tx.attachments = updatedAttachments;
    tx.amount = finalAmount;

    await tx.save({ session });
    await session.commitTransaction();

    res.json({ message: "Transaction updated successfully", transaction: tx });
  } catch (err) {
    await session.abortTransaction();
    console.error("Update transaction error:", err);
    let status = err.status || 500;
    if (err.name === "ValidationError") status = 400;
    else if (err.name === "VersionError") status = 409;
    res.status(status).json({ message: err.message || "Failed to update transaction" });
  } finally {
    session.endSession();
  }
});

/// =======================================================
/// DELETE TRANSACTION
/// =======================================================

router.delete("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (req.user.role !== "Admin") {
      const assignedIds = Array.isArray(req.user.projectIds)
        ? req.user.projectIds.filter(Boolean).map((id) => id.toString())
        : [];
      const legacyId = req.user.projectId ? req.user.projectId.toString() : null;
      const allAssigned = legacyId && !assignedIds.includes(legacyId)
        ? [...assignedIds, legacyId]
        : assignedIds;

      if (!tx.project || !allAssigned.includes(tx.project.toString())) {
        return res.status(403).json({ message: "Access denied to this transaction" });
      }
    } else {
      if (tx.project) {
        const pDoc = await Project.findById(tx.project).session(session);
        if (pDoc && pDoc.createdBy.toString() !== req.user._id.toString()) {
          if (tx.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied to this transaction" });
          }
        }
      }
    }

    await Transaction.deleteOne({ _id: tx._id }).session(session);

    // Reverse inventory on delete
    if (tx.type === "Materials" && tx.quantity > 0 && tx.approvalStatus === "Approved") {
      const adminId = await getAdminId(req.user);
      const txMaterialType = normalizeMaterialType(tx.materialType, tx.subType);
      const reverseDelta = txMaterialType === "usage" ? tx.quantity : -tx.quantity;

      await applyInventoryDelta(
        adminId,
        tx.project,   // FIX: scope to the transaction's project
        tx.category,
        tx.unit,
        reverseDelta,
        session
      );
    }

    await session.commitTransaction();

    if (Array.isArray(tx.attachments)) {
      for (const url of tx.attachments) {
        await deleteFile(url).catch(() => {});
      }
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    console.error("Delete transaction error:", err);
    res.status(500).json({ message: "Failed to delete transaction" });
  } finally {
    session.endSession();
  }
});

/// =======================================================
/// APPROVE TRANSACTION
/// =======================================================
router.put("/:id/approve", requirePermission(["approve_payments", "add_entries"]), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tx = await Transaction.findById(req.params.id).session(session);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (tx.approvalStatus === "Approved") {
      return res.status(400).json({ message: "Transaction is already approved" });
    }

    tx.approvalStatus = "Approved";
    tx.approvedBy = req.user._id;
    tx.approvedAt = new Date();

    const adminId = await getAdminId(req.user);

    // Apply inventory since it's now approved
    if (tx.type === "Materials" && tx.quantity > 0 && tx.project) {
      const materialType = normalizeMaterialType(tx.materialType, tx.subType);
      const inventoryDelta = materialType === "usage" ? -tx.quantity : tx.quantity;

      await applyInventoryDelta(
        adminId,
        tx.project,
        tx.category,
        tx.unit,
        inventoryDelta,
        session
      );
    }

    await tx.save({ session });
    await session.commitTransaction();

    res.json({ message: "Transaction approved successfully", transaction: tx });
  } catch (err) {
    await session.abortTransaction();
    console.error("Approve transaction error:", err);
    res.status(500).json({ message: "Failed to approve transaction" });
  } finally {
    session.endSession();
  }
});

/// =======================================================
/// REJECT TRANSACTION
/// =======================================================
router.put("/:id/reject", requirePermission(["approve_payments", "add_entries"]), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    if (tx.approvalStatus === "Approved") {
      return res.status(400).json({ message: "Cannot reject an already approved transaction" });
    }

    tx.approvalStatus = "Rejected";
    tx.approvedBy = req.user._id;
    tx.approvedAt = new Date();
    tx.rejectionReason = rejectionReason || "";
    await tx.save();

    res.json({ message: "Transaction rejected", transaction: tx });
  } catch (err) {
    console.error("Reject transaction error:", err);
    res.status(500).json({ message: "Failed to reject transaction" });
  }
});

module.exports = router;