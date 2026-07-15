const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const multer = require("multer");

const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const Project = require("../models/Project");
const Inventory = require("../models/Inventory");
const User = require("../models/User");

const { protect, requirePermission, getAdminId, canAccessProjectFilter } = require("../middleware/auth");

const upload = require("../config/multer");

const {
  getFileUrl,
  deleteFile,
} = require("../config/fileHelpers");
const cloudinary = require("../config/cloudinary");

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

const calculateAmount = ({ type, quantity, rate, overtime, rawAmount }) => {
  const qty = Number(quantity) || 0;
  const rt = Number(rate) || 0;
  const ot = Number(overtime) || 0;
  const directAmount = Number(rawAmount) || 0;
  if (type === "Materials") return qty * rt;
  if (type === "Wages") return (qty * rt) + ot;
  if (directAmount !== 0) return directAmount;
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
  transactionType,
  session
) {
  if (!delta || !category || !projectId) return;

  const invCategory = transactionType === "Wages" ? "labour" : transactionType === "Expense" ? "equipment" : "material";

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
          category: invCategory,
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
      // Non-admin: scope to assigned projects only
      const projectFilter = canAccessProjectFilter(req);
      const projects = await Project.find(projectFilter).select("_id");
      const projectIds = projects.map((p) => p._id);
      query.project = { $in: projectIds };
    } else {
      // Admin: scope to ALL projects they own (not just their own entries)
      const adminProjects = await Project.find({ createdBy: req.user._id }).select("_id");
      const adminProjectIds = adminProjects.map((p) => p._id);
      query.project = { $in: adminProjectIds };
    }

    const limitParam = req.query.limit ? parseInt(req.query.limit, 10) : 0;
    const filterByViewAccess = req.query.filterByViewAccess;

    if (filterByViewAccess === 'true') {
      if (req.user.role !== "Admin") {
        const supervisorDoc = await User.findById(req.user._id).select("createdBy overseesRoles");
        const overseesRoles = supervisorDoc?.overseesRoles || [];
        
        let viewableUserIds = [req.user._id];

        if (overseesRoles.length > 0 && supervisorDoc?.createdBy) {
          const allOrgUsers = await User.find({ createdBy: supervisorDoc.createdBy }).select("_id role");
          const overseesRolesLower = overseesRoles.map(r => r.toLowerCase().trim());
          const usersToOversee = allOrgUsers.filter(u => overseesRolesLower.includes((u.role || "").toLowerCase().trim()));
          viewableUserIds.push(...usersToOversee.map(u => u._id));
        }

        query.createdBy = { $in: viewableUserIds };
      }
    } else if (queryCreatedBy && mongoose.Types.ObjectId.isValid(queryCreatedBy)) {
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
    // limitParam was moved up to before the query builder is defined

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
/// GET MY TRANSACTIONS (current user only, used by Mason dashboard)
/// =======================================================
router.get("/my", async (req, res) => {
  try {
    const limitParam = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    const transactions = await Transaction.find({ createdBy: req.user._id })
      .populate("project", "projectName")
      .sort({ date: -1, createdAt: -1 })
      .limit(limitParam);

    res.json({ transactions });
  } catch (err) {
    console.error("Get my transactions error:", err);
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
      overtime,
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

    const resolvedCategory = category !== undefined ? category : "";

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

// FIX: mobile app sends attachments as base64 data URIs in the JSON body
// (not multipart files). The old code silently dropped these.
if (req.body.attachments) {
  let bodyAttachments = req.body.attachments;
  if (typeof bodyAttachments === "string") {
    try {
      bodyAttachments = JSON.parse(bodyAttachments);
    } catch {
      bodyAttachments = [bodyAttachments];
    }
  }
  if (Array.isArray(bodyAttachments)) {
    for (const att of bodyAttachments) {
      if (!att) continue;
      if (typeof att === "string" && att.startsWith("data:")) {
        try {
          const uploadResult = await cloudinary.uploader.upload(att, {
            folder: "buildtrack",
          });
          attachmentFiles.push(uploadResult.secure_url);
        } catch (uploadErr) {
          console.error("Cloudinary attachment upload error:", uploadErr);
        }
      } else {
        // already a URL (e.g. re-saved from an existing entry)
        attachmentFiles.push(att);
      }
    }
  }
}

if (req.body.receiptImage) {
  try {
    const uploadResult = await cloudinary.uploader.upload(req.body.receiptImage, {
      folder: "buildtrack",
    });
    attachmentFiles.push(uploadResult.secure_url);
  } catch (uploadErr) {
    console.error("Cloudinary receiptImage upload error:", uploadErr);
  }
}

// Payment receipt captured via the "Pay Now" toggle at entry-creation time
let paymentReceiptUrl = null;
if (req.body.paymentReceipt) {
  if (typeof req.body.paymentReceipt === "string" && req.body.paymentReceipt.startsWith("data:")) {
    try {
      const uploadResult = await cloudinary.uploader.upload(req.body.paymentReceipt, {
        folder: "buildtrack/payment-receipts",
      });
      paymentReceiptUrl = uploadResult.secure_url;
    } catch (uploadErr) {
      console.error("Cloudinary paymentReceipt upload error:", uploadErr);
    }
  } else {
    paymentReceiptUrl = req.body.paymentReceipt;
  }
}

    const screenshotFile = req.files?.paymentScreenshot?.[0];
    const screenshotUrl = screenshotFile ? getFileUrl(screenshotFile) : null;

    const qty = Number(quantity) || 0;
    const rt = Number(rate) || 0;
    const ot = Number(overtime) || 0;
    const paidAmt = parseAmount(_paidAmount);

    if (qty < 0 || rt < 0) {
      return res.status(400).json({ message: "Quantity and rate must be positive" });
    }

    const finalAmount = calculateAmount({ type, quantity: qty, rate: rt, overtime: ot, rawAmount });

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

          overtime: ot,

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

          paymentReceipt: paymentReceiptUrl,

          paymentHistory: paidAmt > 0 ? [{
            date: paymentDate || date || new Date(),
            method: paymentMode || "Cash",
            amount: paidAmt,
            note: notes || "Initial payment on creation",
            receipt: paymentReceiptUrl || undefined,
          }] : [],

          approvalStatus: txApprovalStatus,
          approvedBy: approvedBy,
          approvedAt: approvedAt,
        });

    await transaction.save({ session });

    // FIX: pass adminId (org admin) AND projectId to applyInventoryDelta
    // so inventory is scoped to { adminId, projectId, materialName }
    if ((type === "Materials" || type === "Wages" || type === "Expense") && qty > 0 && projectId && txApprovalStatus === "Approved") {
      const inventoryDelta = (type === "Materials" && normalizedMaterialType === "usage") ? -qty : qty;

      await applyInventoryDelta(
        adminId,      // organisation's admin (owns inventory records)
        projectId,    // FIX: scope inventory to this specific project
        resolvedCategory || title,
        unit,
        inventoryDelta,
        type,
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
      paymentReceipt,
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
      overtime,
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
    const newOt = overtime !== undefined ? Number(overtime) : tx.overtime;
    const finalAmount = calculateAmount({
      type: type || tx.type,
      quantity: newQty,
      rate: newRt,
      overtime: newOt,
      rawAmount: rawAmount ?? tx.amount,
    });

    // Reverse old inventory (using old project scope)
    if ((tx.type === "Materials" || tx.type === "Wages" || tx.type === "Expense") && tx.quantity > 0 && tx.approvalStatus === "Approved") {
      const oldType = normalizeMaterialType(tx.materialType, tx.subType);
      const reverseDelta = (tx.type === "Materials" && oldType === "usage") ? tx.quantity : -tx.quantity;
      await applyInventoryDelta(
        adminId,
        tx.project,   // use the OLD project for reversal
        tx.category || tx.title,
        tx.unit,
        reverseDelta,
        tx.type,
        session
      );
    }

    // Apply new inventory (using new project scope)
    const newType = type || tx.type;
    const newMaterialType = newType === "Materials"
      ? normalizeMaterialType(materialType || tx.materialType, subType || tx.subType)
      : "";

    if ((newType === "Materials" || newType === "Wages" || newType === "Expense") && newQty > 0 && projectId && tx.approvalStatus === "Approved") {
      const newDelta = (newType === "Materials" && newMaterialType === "usage") ? -newQty : newQty;
      await applyInventoryDelta(
        adminId,
        projectId,    // use the NEW project for application
        category || tx.category || title || tx.title,
        unit || tx.unit,
        newDelta,
        newType,
        session
      );
    }

    let updatedAttachments = req.body.attachments !== undefined ? req.body.attachments : (tx.attachments || []);
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((f) => getFileUrl(f));
      updatedAttachments = [...updatedAttachments, ...newFiles];
    }
    if (req.body.receiptImage) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.body.receiptImage, {
          folder: "buildtrack",
        });
        updatedAttachments = [uploadResult.secure_url];
      } catch (uploadErr) {
        console.error("Cloudinary receiptImage update error:", uploadErr);
      }
    }

    // Payment receipt (separate from invoice attachments) — uploaded from
    // the Fulfillment & Payment screen when recording/settling a payment.
    let newPaymentReceiptUrl = null;
    if (paymentReceipt) {
      if (typeof paymentReceipt === "string" && paymentReceipt.startsWith("data:")) {
        try {
          const uploadResult = await cloudinary.uploader.upload(paymentReceipt, {
            folder: "buildtrack/payment-receipts",
          });
          newPaymentReceiptUrl = uploadResult.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary paymentReceipt upload error:", uploadErr);
        }
      } else {
        // already a URL (e.g. unchanged from a previous save)
        newPaymentReceiptUrl = paymentReceipt;
      }
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

    if (overtime !== undefined)
      tx.overtime = newOt;

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
          receipt: newPaymentReceiptUrl || undefined,
        });
      }
      tx.paidAmount = newPaidAmount;
    }

    if (newPaymentReceiptUrl) {
      tx.paymentReceipt = newPaymentReceiptUrl;
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
    if ((tx.type === "Materials" || tx.type === "Wages" || tx.type === "Expense") && tx.quantity > 0 && tx.approvalStatus === "Approved") {
      const adminId = await getAdminId(req.user);
      const txMaterialType = normalizeMaterialType(tx.materialType, tx.subType);
      const reverseDelta = (tx.type === "Materials" && txMaterialType === "usage") ? tx.quantity : -tx.quantity;

      await applyInventoryDelta(
        adminId,
        tx.project,   // FIX: scope to the transaction's project
        tx.category || tx.title,
        tx.unit,
        reverseDelta,
        tx.type,
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
router.put("/:id/approve", requirePermission(["approve_payments", "add_entries", "approve_updates"]), async (req, res) => {
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
    if ((tx.type === "Materials" || tx.type === "Wages" || tx.type === "Expense") && tx.quantity > 0 && tx.project) {
      const materialType = normalizeMaterialType(tx.materialType, tx.subType);
      const inventoryDelta = (tx.type === "Materials" && materialType === "usage") ? -tx.quantity : tx.quantity;

      await applyInventoryDelta(
        adminId,
        tx.project,
        tx.category || tx.title,
        tx.unit,
        inventoryDelta,
        tx.type,
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
router.put("/:id/reject", requirePermission(["approve_payments", "add_entries", "approve_updates"]), async (req, res) => {
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

/// =======================================================
/// PROJECT PHASE BUDGET UPDATE HELPER
/// =======================================================
async function updateProjectPhaseBudget(projectId, phaseId, activityId, type, amount, session) {
  if (!projectId || !phaseId || !activityId || !amount) return;
  
  const incPayload = {
    "selectedPhases.$[phase].activities.$[activity].totalAmount": amount
  };
  
  if (type === "Materials") {
    incPayload["selectedPhases.$[phase].activities.$[activity].materialAmount"] = amount;
  } else if (type === "Wages") {
    incPayload["selectedPhases.$[phase].activities.$[activity].labourAmount"] = amount;
  } else if (type === "Expense") {
    incPayload["selectedPhases.$[phase].activities.$[activity].equipmentAmount"] = amount;
  }

  await Project.updateOne(
    { _id: projectId },
    { $inc: incPayload },
    {
      arrayFilters: [
        { "phase.id": phaseId },
        { "activity.id": activityId }
      ],
      session
    }
  );
}

/// =======================================================
/// CREATE TRANSACTIONS (BULK)
/// =======================================================
router.post("/bulk", requirePermission(["manage_expenses", "add_entries"]), async (req, res) => {
  const { transactions } = req.body;
  
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ message: "No transactions provided for bulk upload" });
  }

  const results = {
    total: transactions.length,
    successCount: 0,
    failedCount: 0,
    failures: []
  };

  const adminId = await getAdminId(req.user);
  const txApprovalStatus = req.user.role === "Admin" ? "Approved" : "Pending";
  const approvedBy = req.user.role === "Admin" ? req.user._id : null;
  const approvedAt = req.user.role === "Admin" ? new Date() : null;

  for (let i = 0; i < transactions.length; i++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payload = transactions[i];
      const {
        title, type, worker, project, date, notes,
        category, brand, subType, unit, quantity, rate,
        materialType, paymentStatus, paymentMode, paymentDate, paidAmount: _paidAmount,
        remarks, amount: rawAmount, floor, floorId, phase, phaseId, activity, activityId,
        supplier, gst, isWithGst, overtime
      } = payload;

      if (!title || !title.trim()) throw new Error("Title is required");
      if (!type) throw new Error("Transaction type is required");

      const resolvedCategory = category !== undefined ? category : "";
      const normalizedMaterialType = type === "Materials" ? normalizeMaterialType(materialType, subType) : "";

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
        const pDoc = await Project.findOne(canAccessProjectFilter(req, projectId));
        if (!pDoc) throw new Error(`Access denied or Project not found for project: ${project}`);
      } else {
        throw new Error("Valid Project ID is required");
      }

      const qty = Number(quantity) || 0;
      const rt = Number(rate) || 0;
      const ot = Number(overtime) || 0;
      const paidAmt = parseAmount(_paidAmount);

      if (qty < 0 || rt < 0) throw new Error("Quantity and rate must be positive");

      const finalAmount = calculateAmount({ type, quantity: qty, rate: rt, overtime: ot, rawAmount });

      const transaction = new Transaction({
        createdBy: req.user._id,
        title: title.trim(),
        type, worker: workerId || null, project: projectId,
        date: date || new Date(), notes, category: resolvedCategory, brand, supplier,
        gst, isWithGst, subType, materialType: normalizedMaterialType,
        unit: unit || "unit", quantity: qty, rate: rt, overtime: ot, amount: finalAmount,
        floor, floorId, phase, phaseId, activity, activityId,
        paymentStatus: paymentStatus || "Pending", paymentMode: paymentMode || "Cash",
        paymentDate, paidAmount: paidAmt, remarks,
        paymentHistory: paidAmt > 0 ? [{
          date: paymentDate || date || new Date(),
          method: paymentMode || "Cash", amount: paidAmt, note: notes || "Initial payment on bulk creation"
        }] : [],
        approvalStatus: txApprovalStatus, approvedBy, approvedAt
      });

      await transaction.save({ session });

      if ((type === "Materials" || type === "Wages" || type === "Expense") && qty > 0 && projectId && txApprovalStatus === "Approved") {
        const inventoryDelta = (type === "Materials" && normalizedMaterialType === "usage") ? -qty : qty;
        await applyInventoryDelta(adminId, projectId, resolvedCategory || title, unit, inventoryDelta, type, session);
      }

      // Update Phase budget reflection
      if (projectId && phaseId && activityId && txApprovalStatus === "Approved") {
        await updateProjectPhaseBudget(projectId, phaseId, activityId, type, finalAmount, session);
      }

      await session.commitTransaction();
      results.successCount++;
    } catch (err) {
      await session.abortTransaction();
      results.failedCount++;
      results.failures.push({
        index: i,
        title: transactions[i].title || 'Unknown',
        reason: err.message || "Failed to save transaction"
      });
    } finally {
      session.endSession();
    }
  }

  res.status(207).json({
    message: "Bulk processing completed",
    results
  });
});

module.exports = router;