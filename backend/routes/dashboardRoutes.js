// backend/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Project = require("../models/Project");
const Worker = require("../models/Worker");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const statsResult = await Transaction.aggregate([
      { $match: { createdBy: userId, date: { $gte: monthStart, $lt: monthEnd } } },
      {
        $group: {
          _id: null,
          totalIncome:   { $sum: { $cond: [{ $eq: ["$type", "Income"] }, "$amount", 0] } },
          totalExpenses: { $sum: { $cond: [{ $ne: ["$type", "Income"] }, "$amount", 0] } },
        },
      },
    ]);

    const { totalIncome = 0, totalExpenses = 0 } = statsResult[0] || {};
    const activeWorkers = await Worker.countDocuments({ createdBy: userId, status: "Active" });

    // 2. Weekly Chart (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTransactions = await Transaction.find({
      createdBy: userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const weeklyChart = [];

    // Initialize the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      weeklyChart.push({ day: dayName, revenue: 0, expenses: 0, dateStr: d.toDateString() });
    }

    // Populate data
    weeklyTransactions.forEach((t) => {
      const tDateStr = new Date(t.date).toDateString();
      const dayData = weeklyChart.find((d) => d.dateStr === tDateStr);
      if (dayData) {
        if (t.type === "Income") {
          dayData.revenue += t.amount;
        } else {
          dayData.expenses += t.amount;
        }
      }
    });

    // 3. Recent Projects (Last 4)
    const recentProjects = await Project.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(4);

    // 4. Recent Activity (Last 5 transactions)
    const recentActivity = await Transaction.find({ createdBy: userId })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      stats: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        activeWorkers,
      },
      weeklyChart: weeklyChart.map(({ day, revenue, expenses }) => ({ day, revenue, expenses })),
      recentProjects,
      recentActivity,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

module.exports = router;
