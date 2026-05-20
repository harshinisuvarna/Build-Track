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

  const parsedYear =
    parseInt(year) || new Date().getFullYear();

  const parsedMonth =
    parseInt(month) || new Date().getMonth();

  return {
    startDate: new Date(
      parsedYear,
      parsedMonth,
      1,
      0,
      0,
      0,
      0
    ),

    endDate: new Date(
      parsedYear,
      parsedMonth + 1,
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
  return `₹${Number(n || 0).toLocaleString(
    "en-IN"
  )}`;
}

/// =======================================================
/// NORMALIZE PROJECT STATUS
/// =======================================================

function normalizeProjectStatus(status) {
  const s = String(status || "").toLowerCase();

  if (
    s === "completed" ||
    s === "planning"
  ) {
    return "ON TRACK";
  }

  if (
    s === "on hold" ||
    s === "cancelled"
  ) {
    return "REVIEW NEEDED";
  }

  return "IN PROGRESS";
}

/// =======================================================
/// FINANCIAL REPORT
/// =======================================================

router.get("/financial", async (req, res) => {
  try {
    const {
      type,
      category,
      project,
    } = req.query;

    const userId = req.user?._id;

    const { startDate, endDate } =
      getDateRange(req.query);

    /// =======================================================
    /// QUERY
    /// =======================================================

    const query = {
      createdBy: userId,

      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (type && type !== "All") {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (project) {
      query.project = project;
    }

    /// =======================================================
    /// TRANSACTIONS
    /// =======================================================

    const transactions =
      await Transaction.find(query)
        .populate(
          "project",
          "projectName status budget progress"
        )
        .populate(
          "worker",
          "_id name trade dailyWage"
        )
        .sort({
          date: -1,
          createdAt: -1,
        });

    /// =======================================================
    /// FINANCIAL SUMMARY
    /// =======================================================

    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce(
        (sum, t) =>
          sum + Number(t.amount || 0),
        0
      );

    const expenses = transactions
      .filter((t) => t.type !== "Income")
      .reduce(
        (sum, t) =>
          sum + Number(t.amount || 0),
        0
      );

    const profit = income - expenses;

    const totalVolume =
      income + expenses;

    const compliance =
      totalVolume > 0
        ? Math.min(
            100,
            Math.max(
              0,
              (income / totalVolume) * 100
            )
          )
        : 100;

    /// =======================================================
    /// PROJECT ANALYTICS
    /// =======================================================

    const projects =
      await Project.find({
        createdBy: userId,
      });

    const projectAnalytics =
      projects.map((p) => {
        const pTransactions =
          transactions.filter(
            (t) =>
              t.project?._id?.toString() ===
              p._id.toString()
          );

        const spent = pTransactions.reduce(
          (sum, t) =>
            sum + Number(t.amount || 0),
          0
        );

        const totalBudget =
          Number(p.budget?.total || 0);

        const remaining =
          totalBudget - spent;

        const utilization =
          totalBudget > 0
            ? (
                (spent / totalBudget) *
                100
              ).toFixed(1)
            : 0;

        return {
          _id: p._id,
          projectName: p.projectName,
          status: p.status,
          progress: p.progress || 0,

          totalBudget,
          spentAmount: spent,
          remainingBudget: remaining,
          utilization,
        };
      });

    /// =======================================================
    /// WORKERS
    /// =======================================================

    const workersRecords =
      await Worker.find({
        createdBy: userId,
      });

    const wageTransactions =
      transactions.filter(
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

      workerStats[wId].totalPayout +=
        Number(t.amount || 0);

      workerStats[wId].daySet.add(
        new Date(t.date)
          .toISOString()
          .slice(0, 10)
      );

      if (
        !workerStats[wId].project &&
        t.project
      ) {
        workerStats[wId].project =
          t.project;
      }
    });

    const workers = workersRecords
      .filter((w) =>
        workerStats[w._id.toString()]
      )
      .map((w) => {
        const stats =
          workerStats[
            w._id.toString()
          ];

        return {
          _id: w._id,

          name: w.name,

          trade:
            w.trade ||
            "General Labor",

          dailyWage:
            w.dailyWage || 0,

          totalDays:
            stats.daySet.size,

          estimatedMonthlyPayout:
            stats.totalPayout,

          project:
            stats.project
              ?.projectName ||
            "Various",

          projectStatus:
            normalizeProjectStatus(
              stats.project?.status
            ),
        };
      });

    /// =======================================================
    /// CATEGORY BREAKDOWN
    /// =======================================================

    const categoryBreakdown = {
      Materials: 0,
      Wages: 0,
      Expense: 0,
      Income: 0,
      Equipment: 0,
      Misc: 0,
    };

    transactions.forEach((t) => {
      const amount = Number(
        t.amount || 0
      );

      const typeKey =
        t.type || "Misc";

      if (
        categoryBreakdown[typeKey] ===
        undefined
      ) {
        categoryBreakdown[typeKey] = 0;
      }

      categoryBreakdown[typeKey] +=
        amount;
    });

    /// =======================================================
    /// MONTHLY TREND
    /// =======================================================

    const monthlyTrend = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyTrend[key]) {
        monthlyTrend[key] = {
          income: 0,
          expenses: 0,
        };
      }

      if (t.type === "Income") {
        monthlyTrend[key].income +=
          Number(t.amount || 0);
      } else {
        monthlyTrend[key].expenses +=
          Number(t.amount || 0);
      }
    });

    /// =======================================================
    /// ANALYTICS FOR CHART UI
    /// =======================================================

    const analytics = {
      material:
        categoryBreakdown[
          "Materials"
        ] || 0,

      labour:
        categoryBreakdown[
          "Wages"
        ] || 0,

      equipment:
        categoryBreakdown[
          "Equipment"
        ] || 0,

      misc:
        categoryBreakdown[
          "Expense"
        ] || 0,

      targetCost: 1500,
    };

    const latestActual =
      analytics.material +
      analytics.labour +
      analytics.equipment +
      analytics.misc;

    analytics.latestActual =
      latestActual;

    analytics.chartStatus =
      latestActual >
      analytics.targetCost
        ? "OVER_BUDGET"
        : "ON_TRACK";

    /// =======================================================
    /// RECENT TRANSACTIONS
    /// =======================================================

    const recentTransactions =
      transactions
        .slice(0, 10)
        .map((t) => ({
          _id: t._id,

          title: t.title,

          type: t.type,

          amount: t.amount,

          date: t.date,

          category: t.category,

          project:
            t.project?.projectName ||
            "N/A",

          worker:
            t.worker?.name || "N/A",
        }));

    /// =======================================================
    /// RESPONSE
    /// =======================================================

    res.json({
      success: true,

      income,
      expenses,
      profit,
      compliance,

      transactionCount:
        transactions.length,

      workers,

      projects: projectAnalytics,

      categoryBreakdown,

      analytics,

      monthlyTrend,

      recentTransactions,

      dateRange: {
        startDate,
        endDate,
      },
    });
  } catch (err) {
    console.error(
      "Financial report error:",
      err
    );

    res.status(500).json({
      success: false,

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
      const userId = req.user._id;

      const { startDate, endDate } =
        getDateRange(req.query);

      const wageTransactions =
        await Transaction.find({
          createdBy: userId,

          type: "Wages",

          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
          .populate(
            "worker",
            "name trade dailyWage"
          )
          .populate(
            "project",
            "projectName"
          );

      const header =
        "Worker Name,Role,Project,Date,Daily Rate,Amount\n";

      const rows = wageTransactions
        .map((t) => {
          const worker =
            t.worker || {};

          const project =
            t.project || {};

          return [
            `"${(
              worker.name || ""
            ).replace(/"/g, '""')}"`,

            `"${(
              worker.trade ||
              "General Labor"
            ).replace(/"/g, '""')}"`,

            `"${(
              project.projectName ||
              "Various"
            ).replace(/"/g, '""')}"`,

            new Date(t.date)
              .toISOString()
              .slice(0, 10),

            worker.dailyWage || 0,

            t.amount || 0,
          ].join(",");
        })
        .join("\n");

      const csv =
        header + rows;

      const filename = `BuildTrack_Wages_Report.csv`;

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
      console.error(
        "CSV export error:",
        err
      );

      res.status(500).json({
        message:
          "Failed to export CSV",
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
      const userId = req.user._id;

      const { startDate, endDate } =
        getDateRange(req.query);

      const transactions =
        await Transaction.find({
          createdBy: userId,

          date: {
            $gte: startDate,
            $lte: endDate,
          },
        }).populate(
          "project",
          "projectName"
        );

      const income = transactions
        .filter(
          (t) => t.type === "Income"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

      const expenses = transactions
        .filter(
          (t) => t.type !== "Income"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

      const profit =
        income - expenses;

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="financial-report.pdf"'
      );

      const doc =
        new PDFDocument({
          margin: 40,
        });

      doc.pipe(res);

      doc
        .fontSize(22)
        .text(
          "BuildTrack Financial Report",
          {
            align: "center",
          }
        );

      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          `Generated: ${new Date().toLocaleString()}`
        );

      doc.moveDown();

      doc.text(
        `Income: ${formatINR(income)}`
      );

      doc.text(
        `Expenses: ${formatINR(
          expenses
        )}`
      );

      doc.text(
        `Profit: ${formatINR(profit)}`
      );

      doc.moveDown();

      doc
        .fontSize(16)
        .text(
          "Recent Transactions"
        );

      doc.moveDown(0.5);

      transactions
        .slice(0, 15)
        .forEach((t) => {
          doc
            .fontSize(11)
            .text(
              `${new Date(
                t.date
              ).toLocaleDateString()} | ${
                t.title
              } | ${
                t.type
              } | ${formatINR(
                t.amount
              )}`
            );
        });

      doc.end();
    } catch (err) {
      console.error(
        "PDF export error:",
        err
      );

      res.status(500).json({
        message:
          "Failed to export PDF",
      });
    }
  }
);

module.exports = router;