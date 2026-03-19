// backend/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/reports/financial
// Query params: ?year=2025&month=2 (0-indexed month)
router.get("/financial", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;

    if (!year || !month) return res.status(400).json({ message: "Year and month are required" });

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, parseInt(month) + 1, 1, 0, 0, 0, 0);

    const transactions = await Transaction.find({
      createdBy: userId,
      date: { $gte: startDate, $lt: endDate },
    });

    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type !== "Income")
      .reduce((sum, t) => sum + t.amount, 0);
    const profit = income - expenses;
    const totalVolume = income + expenses;
    const compliance = totalVolume > 0 ? Math.min(100, Math.max(0, (income / totalVolume) * 100)) : 0;

    const workersRecords = await Worker.find({ createdBy: userId });
    const workers = workersRecords.map((w) => ({
      name: w.name,
      trade: w.trade,
      dailyWage: w.dailyWage,
      estimatedMonthlyPayout: (w.dailyWage || 0) * 26,
    }));

    res.json({
      income,
      expenses,
      profit,
      compliance,
      workers,
    });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ message: "Failed to fetch financial report" });
  }
});

module.exports = router;
