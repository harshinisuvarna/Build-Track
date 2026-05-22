const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const multer = require("multer");

const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const Project = require("../models/Project");
const Inventory = require("../models/Inventory");

const { protect } = require("../middleware/auth");

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
  mongoose.Types.ObjectId.isValid(id)
    ? id
    : null;

const normalizeMaterialType = (
  materialType,
  subType
) => {
  if (
    materialType === "purchase" ||
    materialType === "usage"
  ) {
    return materialType;
  }

  if (subType === "Consumption") {
    return "usage";
  }

  return "purchase";
};

const calculateAmount = ({
  type,
  quantity,
  rate,
  rawAmount,
}) => {
  const qty = Number(quantity) || 0;

  const rt = Number(rate) || 0;

  const directAmount =
    Number(rawAmount) || 0;

  if (type === "Materials") {
    return qty * rt;
  }

  if (directAmount > 0) {
    return directAmount;
  }

  return qty * rt;
};

/// =======================================================
/// FILE UPLOADS
/// =======================================================

const runTransactionCreateUpload = (
  req,
  res
) =>
  new Promise((resolve, reject) => {
    upload.fields([
      {
        name: "attachments",
        maxCount: 5,
      },

      {
        name: "paymentScreenshot",
        maxCount: 1,
      },
    ])(req, res, (err) => {
      if (
        err instanceof multer.MulterError
      ) {
        return reject(
          Object.assign(err, {
            status: 400,
          })
        );
      }

      if (err) {
        return reject(
          Object.assign(err, {
            status: 400,
          })
        );
      }

      resolve();
    });
  });

const runTransactionUpdateUpload = (
  req,
  res
) =>
  new Promise((resolve, reject) => {
    upload.array("attachments")(req, res, (err) => {
      if (
        err instanceof multer.MulterError
      ) {
        return reject(
          Object.assign(err, {
            status: 400,
          })
        );
      }

      if (err) {
        return reject(
          Object.assign(err, {
            status: 400,
          })
        );
      }

      resolve();
    });
  });

/// =======================================================
/// RESOLVE IDS
/// =======================================================

async function resolveIds(
  userId,
  { worker, project }
) {
  let workerId = parseId(worker);

  let projectId = parseId(project);

  if (!workerId && worker) {
    const wDoc = await Worker.findOne({
      createdBy: userId,

      name: String(worker).trim(),
    }).lean();

    workerId = wDoc?._id || null;
  }

  if (!projectId && project) {
    const pDoc = await Project.findOne({
      createdBy: userId,

      projectName: String(project).trim(),
    }).lean();

    projectId = pDoc?._id || null;
  }

  return {
    workerId,
    projectId,
  };
}

/// =======================================================
/// INVENTORY
/// =======================================================

async function applyInventoryDelta(
  userId,
  projectId,
  category,
  unit,
  delta,
  session
) {
  if (
    !delta ||
    !category ||
    !projectId
  ) {
    return;
  }

  /// PURCHASE

  if (delta > 0) {
    await Inventory.updateOne(
      {
        createdBy: userId,

        project: projectId,

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

  /// USAGE

  else if (delta < 0) {
    const absQty = Math.abs(delta);

    const inv =
      await Inventory.findOne(
        {
          createdBy: userId,

          project: projectId,

          materialName: category,
        },

        null,

        { session }
      );

    if (!inv) {
      throw Object.assign(
        new Error(
          "No stock found for this material"
        ),

        {
          status: 400,
        }
      );
    }

    if (inv.closingStock < absQty) {
      throw Object.assign(
        new Error(
          "Insufficient stock"
        ),

        {
          status: 400,
        }
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
    } = req.query;

    const query = {
      createdBy: req.user._id,
    };

    if (
      type &&
      type !== "All"
    ) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (project) {
      query.project = project;
    }

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte =
          new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);

        end.setHours(
          23,
          59,
          59,
          999
        );

        query.date.$lte = end;
      }
      transaction.paidAmount = Number(paidAmount);
    }

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },

        {
          notes: {
            $regex: search,
            $options: "i",
          },
        },

        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const transactions =
      await Transaction.find(query)
        .populate(
          "worker",
          "name trade"
        )

        .populate(
          "project",
          "projectName status progress"
        )

        .sort({
          date: -1,

          createdAt: -1,
        });

    res.json({
      transactions,
    });
  } catch (err) {
    console.error(
      "Get transactions error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to fetch transactions",
    });
  }
});

/// =======================================================
/// GET SINGLE TRANSACTION
/// =======================================================

router.get("/:id", async (req, res) => {
  try {
    const tx =
      await Transaction.findOne({
        _id: req.params.id,

        createdBy: req.user._id,
      })
        .populate(
          "worker",
          "name trade"
        )

        .populate(
          "project",
          "projectName status progress"
        );

    if (!tx) {
      return res.status(404).json({
        message:
          "Transaction not found",
      });
    }

    res.json({
      transaction: tx,
    });
  } catch (err) {
    console.error(
      "Get transaction error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to fetch transaction",
    });
  }
});

/// =======================================================
/// CREATE TRANSACTION
/// =======================================================

router.post("/", async (req, res) => {
  try {
    await runTransactionCreateUpload(
      req,
      res
    );
  } catch (uploadErr) {
    return res.status(400).json({
      message:
        uploadErr.message ||
        "File upload error",
    });
  }

  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {
    const {
      title,
      type,
      worker,
      project,
      date,
      notes,

      category,
      brand,
      subType,
      unit,
      quantity,
      rate,

      materialType,

      paymentStatus,
      paymentMode,
      paymentDate,
      paidAmount,
      remarks,

      amount: rawAmount,
    } = req.body;

    /// VALIDATIONS

    if (
      !title ||
      !title.trim()
    ) {
      return res.status(400).json({
        message:
          "Title is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        message:
          "Transaction type is required",
      });
    }

    const resolvedCategory =
      category ||
      (type === "Materials"
        ? title.trim()
        : undefined);

    const normalizedMaterialType =
      type === "Materials"
        ? normalizeMaterialType(
          materialType,
          subType
        )
        : "";

    const {
      workerId,
      projectId,
    } = await resolveIds(
      req.user._id,
      {
        worker,
        project,
      }
    );

    /// FILES

    const attachmentFiles = (
      req.files?.attachments || []
    ).map(getFileUrl);

    const screenshotFile =
      req.files
        ?.paymentScreenshot?.[0];

    const screenshotUrl =
      screenshotFile
        ? getFileUrl(
          screenshotFile
        )
        : null;

    /// VALUES

    const qty =
      Number(quantity) || 0;

    const rt =
      Number(rate) || 0;

    const paidAmt =
      Number(paidAmount) || 0;

    if (qty < 0 || rt < 0) {
      return res.status(400).json({
        message:
          "Quantity and rate must be positive",
      });
    }

    const finalAmount =
      calculateAmount({
        type,

        quantity: qty,

        rate: rt,

        rawAmount,
      });

    /// CREATE

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

        subType,

        materialType:
          normalizedMaterialType,

        unit:
          unit || "unit",

        quantity: qty,

        rate: rt,

        amount: finalAmount,

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
      });

    await transaction.save({
      session,
    });

    /// INVENTORY

    if (
      type === "Materials" &&
      qty > 0 &&
      projectId
    ) {
      const inventoryDelta =
        normalizedMaterialType ===
          "usage"
          ? -qty
          : qty;

      await applyInventoryDelta(
        req.user._id,
        projectId,
        resolvedCategory,
        unit,
        inventoryDelta,
        session
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      message:
        "Transaction saved successfully",

      transaction,
    });
  } catch (err) {
    await session.abortTransaction();

    console.error(
      "Create transaction error:",
      err
    );

    const status =
      err.status || 500;

    res.status(status).json({
      message:
        err.message ||
        "Failed to save transaction",
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
    return res.status(400).json({
      message:
        uploadErr.message ||
        "File upload error",
    });
  }

  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {
    const tx =
      await Transaction.findOne(
        {
          _id: req.params.id,

          createdBy:
            req.user._id,
        },

        null,

        { session }
      );

    if (!tx) {
      return res.status(404).json({
        message:
          "Transaction not found",
      });
    }

    const {
      title,
      type,
      worker,
      project,
      date,
      notes,

      category,
      brand,
      subType,
      unit,
      quantity,
      rate,

      materialType,

      paymentStatus,
      paymentMode,
      paymentDate,
      paidAmount,
      remarks,

      amount: rawAmount,
    } = req.body;

    const {
      workerId,
      projectId,
    } = await resolveIds(
      req.user._id,
      {
        worker:
          worker ?? tx.worker,

        project:
          project ?? tx.project,
      }
    );

    const newQty =
      quantity !== undefined
        ? Number(quantity)
        : tx.quantity;

    const newRt =
      rate !== undefined
        ? Number(rate)
        : tx.rate;

    const finalAmount =
      calculateAmount({
        type: type || tx.type,

        quantity: newQty,

        rate: newRt,

        rawAmount:
          rawAmount ??
          tx.amount,
      });

    /// REVERSE OLD INVENTORY

    if (
      tx.type === "Materials" &&
      tx.quantity > 0
    ) {
      const oldType =
        normalizeMaterialType(
          tx.materialType,
          tx.subType
        );

      const reverseDelta =
        oldType === "usage"
          ? tx.quantity
          : -tx.quantity;

      await applyInventoryDelta(
        req.user._id,
        tx.project,
        tx.category,
        tx.unit,
        reverseDelta,
        session
      );
    }

    /// APPLY NEW INVENTORY

    const newType =
      type || tx.type;

    const newMaterialType =
      newType === "Materials"
        ? normalizeMaterialType(
          materialType ||
          tx.materialType,

          subType ||
          tx.subType
        )
        : "";

    if (
      newType === "Materials" &&
      newQty > 0 &&
      projectId
    ) {
      const newDelta =
        newMaterialType ===
          "usage"
          ? -newQty
          : newQty;

      await applyInventoryDelta(
        req.user._id,
        projectId,
        category ||
        tx.category,
        unit || tx.unit,
        newDelta,
        session
      );
    }

    /// ATTACHMENTS

    let updatedAttachments =
      tx.attachments || [];

    if (
      req.files &&
      req.files.length > 0
    ) {
      const newFiles =
        req.files.map((f) =>
          getFileUrl(f)
        );

      updatedAttachments = [
        ...updatedAttachments,
        ...newFiles,
      ];
    }

    /// UPDATE

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

    if (
      paidAmount !== undefined
    ) {
      const newPaidAmount = Number(paidAmount) || 0;
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

    if (remarks !== undefined) {
      tx.remarks = remarks;
    }

    tx.attachments =
      updatedAttachments;

    tx.amount = finalAmount;

    await tx.save({
      session,
    });

    await session.commitTransaction();

    res.json({
      message:
        "Transaction updated successfully",

      transaction: tx,
    });
  } catch (err) {
    await session.abortTransaction();

    console.error(
      "Update transaction error:",
      err
    );

    const status =
      err.status || 500;

    res.status(status).json({
      message:
        err.message ||
        "Failed to update transaction",
    });
  } finally {
    session.endSession();
  }
});

/// =======================================================
/// DELETE TRANSACTION
/// =======================================================

router.delete("/:id", async (req, res) => {
  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {
    const tx =
      await Transaction.findOneAndDelete(
        {
          _id: req.params.id,

          createdBy:
            req.user._id,
        },

        { session }
      );

    if (!tx) {
      return res.status(404).json({
        message:
          "Transaction not found",
      });
    }

    /// REVERSE INVENTORY

    if (
      tx.type === "Materials" &&
      tx.quantity > 0
    ) {
      const txMaterialType =
        normalizeMaterialType(
          tx.materialType,
          tx.subType
        );

      const reverseDelta =
        txMaterialType ===
          "usage"
          ? tx.quantity
          : -tx.quantity;

      await applyInventoryDelta(
        req.user._id,
        tx.project,
        tx.category,
        tx.unit,
        reverseDelta,
        session
      );
    }

    await session.commitTransaction();

    /// DELETE FILES

    if (
      Array.isArray(
        tx.attachments
      )
    ) {
      for (const url of tx.attachments) {
        await deleteFile(url).catch(
          () => { }
        );
      }
    }

    res.json({
      message:
        "Transaction deleted successfully",
    });
  } catch (err) {
    await session.abortTransaction();

    console.error(
      "Delete transaction error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to delete transaction",
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;