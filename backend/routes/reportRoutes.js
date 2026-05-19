const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const Project = require("../models/Project");

const { protect } = require("../middleware/auth");

router.use(protect);

/// =======================================================
/// DATE RANGE
/// =======================================================

function getDateRange(query) {
  const { year, month, rangeStart, rangeEnd } = query;

  if (rangeStart && rangeEnd) {
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);

    end.setHours(23, 59, 59, 999);

    return {
      startDate: start,
      endDate: end,
    };
  }

  return {
    startDate: new Date(year, month, 1, 0, 0, 0, 0),

    endDate: new Date(
      year,
      parseInt(month) + 1,
      0,
      23,
      59,
      59,
      999
    ),
  };
}

/// =======================================================
/// FORMAT INR
/// =======================================================

function formatINR(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

/// =======================================================
/// NORMALIZE PROJECT STATUS
/// =======================================================

function normalizeProjectStatus(status) {
  const s = String(status || "").toLowerCase();

  if (s === "on track" || s === "completed") {
    return "ON TRACK";
  }

  if (s === "review needed" || s === "on hold") {
    return "REVIEW NEEDED";
  }

  return "IN PROGRESS";
}

/// =======================================================
/// FINANCIAL REPORT
/// =======================================================

router.get("/financial", async (req, res) => {
  try {
    const { year, month, type, category, project } = req.query;

    const userId = req.user?._id;

    const { startDate, endDate } = getDateRange(req.query);

    /// QUERY

    const query = {
      createdBy: userId,

      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (type) query.type = type;
    if (category) query.category = category;
    if (project) query.project = project;

    /// TRANSACTIONS

    const transactions = await Transaction.find(query)
      .populate("project", "projectName status")
      .populate("worker", "_id name trade dailyWage");

    /// FINANCIAL SUMMARY

    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = transactions
      .filter((t) => t.type !== "Income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const profit = income - expenses;

    const totalVolume = income + expenses;

    const compliance =
      totalVolume > 0
        ? Math.min(
            100,
            Math.max(0, (income / totalVolume) * 100)
          )
        : 100;

    /// WORKERS

    const workersRecords = await Worker.find({
      createdBy: userId,
    });

    const projects = await Project.find({
      createdBy: userId,
    });

    const wageTransactions = transactions.filter(
      (t) => t.type === "Wages"
    );

    const workerStats = {};

    wageTransactions.forEach((t) => {
      const wId =
        t.worker?._id?.toString() ||
        t.worker?.toString();

      if (!wId) return;

      if (!workerStats[wId]) {
        workerStats[wId] = {
          totalPayout: 0,
          daySet: new Set(),
          project: null,
        };
      }

      workerStats[wId].totalPayout += Number(
        t.amount || 0
      );

      workerStats[wId].daySet.add(
        new Date(t.date)
          .toISOString()
          .slice(0, 10)
      );

      if (!workerStats[wId].project && t.project) {
        workerStats[wId].project = t.project;
      }
    });

    const workers = workersRecords
      .filter((w) => workerStats[w._id.toString()])
      .map((w) => {
        const stats = workerStats[w._id.toString()];

        return {
          _id: w._id,
          name: w.name,
          trade: w.trade,
          dailyWage: w.dailyWage,

          totalDays: stats.daySet.size,

          estimatedMonthlyPayout:
            stats.totalPayout,

          project:
            stats.project?.projectName ||
            "Various",

          projectStatus:
            normalizeProjectStatus(
              stats.project?.status
            ),
        };
      });

    /// CATEGORY BREAKDOWN

    const categoryBreakdown = {};

    transactions.forEach((t) => {
      const cat =
        t.category || t.type || "Other";

      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = 0;
      }

      categoryBreakdown[cat] += Number(
        t.amount || 0
      );
    });

    /// =======================================================
    /// ANALYTICS FOR CHART UI
    /// =======================================================

    const analytics = {
      material:
        categoryBreakdown["Materials"] || 0,

      labour:
        categoryBreakdown["Wages"] || 0,

      equipment:
        categoryBreakdown["Equipment"] || 0,

      misc:
        categoryBreakdown["Misc"] || 0,

      targetCost: 1500,
    };

    const latestActual =
      analytics.material +
      analytics.labour +
      analytics.equipment +
      analytics.misc;

    analytics.latestActual = latestActual;

    analytics.chartStatus =
      latestActual > analytics.targetCost
        ? "OVER_BUDGET"
        : "ON_TRACK";

    /// RESPONSE

    res.json({
      income,
      expenses,
      profit,
      compliance,

      workers,

      projects,

      categoryBreakdown,

      transactionCount:
        transactions.length,

      analytics,
    });
  } catch (err) {
    console.error(
      "Financial report error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to fetch financial report",
    });
  }
});

/// =======================================================
/// EXPORT CSV
/// =======================================================

router.get(
  "/financial/export-csv",
  async (req, res) => {
    try {
      const { year, month } = req.query;

      const userId = req.user._id;

      if (
        !year ||
        month === undefined ||
        month === ""
      ) {
        return res.status(400).json({
          message:
            "Year and month are required",
        });
      }

      const { startDate, endDate } =
        getDateRange(req.query);

      const rangeDays = Math.max(
        1,
        Math.round(
          (endDate - startDate) /
            (1000 * 60 * 60 * 24)
        )
      );

      const workingDays = Math.round(
        rangeDays * 0.86
      );

      const workersRecords = await Worker.find({
        createdBy: userId,
      });

      const wageTransactions =
        await Transaction.find({
          createdBy: userId,
          type: "Wages",

          date: {
            $gte: startDate,
            $lte: endDate,
          },
        });

      const workerWageMap = {};

      wageTransactions.forEach((t) => {
        const wId = t.worker?.toString();

        if (wId) {
          if (!workerWageMap[wId]) {
            workerWageMap[wId] = 0;
          }

          workerWageMap[wId] += t.amount;
        }
      });

      const header =
        "Worker Name,Role,Project,Total Days,Daily Rate,Total Payout\n";

      const rows = workersRecords
        .map((w) => {
          const name = `"${(
            w.name || ""
          ).replace(/"/g, '""')}"`;

          const trade = `"${(
            w.trade || "General Labor"
          ).replace(/"/g, '""')}"`;

          const project = `"Various"`;

          const totalDays =
            workingDays;

          const rate =
            w.dailyWage || 0;

          const actualPayout =
            workerWageMap[
              w._id.toString()
            ] || 0;

          const payout =
            actualPayout > 0
              ? actualPayout
              : rate * workingDays;

          return `${name},${trade},${project},${totalDays},${rate},${payout}`;
        })
        .join("\n");

      const csv = header + rows;

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const filename = `BuildTrack_Wages_${
        monthNames[parseInt(month)]
      }_${year}.csv`;

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.send(csv);
    } catch (err) {
      res.status(500).json({
        message: "Failed to export CSV",
      });
    }
  }
);

/// =======================================================
/// EXPORT PDF
/// =======================================================

router.get(
  "/financial/export-pdf",
  async (req, res) => {
    try {
      res.status(200).json({
        message:
          "PDF export route working",
      });
    } catch (err) {
      res.status(500).json({
        message:
          "Failed to export PDF",
      });
    }
  }
);

module.exports = router;