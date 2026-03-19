// backend/routes/transactionRoutes.js
const express       = require("express");
const router        = express.Router();
const Transaction   = require("../models/Transaction");
const { protect }   = require("../middleware/auth");

// All routes require valid JWT
router.use(protect);


// ─── GET ALL TRANSACTIONS ─────────────────────────────────────────────────────
// GET /api/transactions
router.get("/", async (req, res) => {
  try {
    const { type, search } = req.query;
    const query = { createdBy: req.user._id };

    if (type && type !== "All") query.type = type;

    if (search) {
      query.$or = [
        { title:   { $regex: search, $options: "i" } },
        { worker:  { $regex: search, $options: "i" } },
        { project: { $regex: search, $options: "i" } },
        { notes:   { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    res.json({ transactions });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});


// ─── CREATE TRANSACTION ────────────────────────────────────────────────────────
// POST /api/transactions   (JSON body)
router.post("/", async (req, res) => {
  try {
    const { title, amount, type, worker, project, date, notes } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ message: "Title is required" });

    if (!amount || isNaN(Number(amount)))
      return res.status(400).json({ message: "Valid amount is required" });

    if (!type)
      return res.status(400).json({ message: "Transaction type is required" });

    const transaction = await Transaction.create({
      createdBy: req.user._id,
      title:     title.trim(),
      amount:    Number(amount),
      type,
      worker:    worker  || "",
      project:   project || "",
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


// ─── DELETE TRANSACTION ────────────────────────────────────────────────────────
// DELETE /api/transactions/:id
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
