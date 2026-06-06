const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Project = require("../models/Project");
const Worker = require("../models/Worker");
const { protect, getAdminId, canAccessProjectFilter } = require("../middleware/auth");
router.use(protect);
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const projectFilter = canAccessProjectFilter(req);
    const accessibleProjects = await Project.find(projectFilter).select("_id");
    const projectIds = accessibleProjects.map((p) => p._id);

    let matchFilter = { date: { $gte: monthStart, $lt: monthEnd } };
    if (req.user.role !== "Admin") {
      matchFilter.project = { $in: projectIds };
    } else {
      matchFilter.createdBy = userId;
    }

    const statsResult = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalIncome:   { $sum: { $cond: [{ $eq: ["$type", "Income"] }, "$amount", 0] } },
          totalExpenses: { $sum: { $cond: [{ $ne: ["$type", "Income"] }, "$amount", 0] } },
        },
      },
    ]);
    const { totalIncome = 0, totalExpenses = 0 } = statsResult[0] || {};
    const adminId = await getAdminId(req.user);
    const activeWorkers = await Worker.countDocuments({ createdBy: adminId, status: "Active" });
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    let weeklyFilter = { date: { $gte: sevenDaysAgo } };
    if (req.user.role !== "Admin") {
      weeklyFilter.project = { $in: projectIds };
    } else {
      weeklyFilter.createdBy = userId;
    }

    const weeklyTransactions = await Transaction.find(weeklyFilter).sort({ date: 1 });
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      weeklyChart.push({ day: dayName, revenue: 0, expenses: 0, dateStr: d.toDateString() });
    }
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
    const recentProjects = await Project.find(canAccessProjectFilter(req))
      .sort({ createdAt: -1 })
      .limit(4);

    let activityFilter = {};
    if (req.user.role !== "Admin") {
      activityFilter.project = { $in: projectIds };
    } else {
      activityFilter.createdBy = userId;
    }

    const recentActivity = await Transaction.find(activityFilter)
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
