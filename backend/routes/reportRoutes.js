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

    if (!year || month === undefined || month === "") return res.status(400).json({ message: "Year and month are required" });

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
    // When no expenditures, adherence to budget is fully intact (100%).
    const compliance = totalVolume > 0 ? Math.min(100, Math.max(0, (income / totalVolume) * 100)) : 100;

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
// GET /api/reports/financial/export-csv
// Returns a downloadable CSV file of transactions for the given month
router.get("/financial/export-csv", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;

    if (!year || month === undefined || month === "") return res.status(400).json({ message: "Year and month are required" });

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, parseInt(month) + 1, 1, 0, 0, 0, 0);

    const transactions = await Transaction.find({
      createdBy: userId,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    // Build CSV
    const header = "Date,Title,Type,Amount,Worker,Project,Notes\n";
    const rows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString("en-IN");
      const title = `"${(t.title || "").replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || "").replace(/"/g, '""')}"`;
      return `${date},${title},${t.type},${t.amount},${t.worker || ""},${t.project || ""},${notes}`;
    }).join("\n");

    const csv = header + rows;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const filename = `BuildTrack_Report_${monthNames[parseInt(month)]}_${year}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Failed to export CSV" });
  }
});


// GET /api/reports/financial/export-pdf
// Returns a plain-text formatted financial report as a downloadable file
router.get("/financial/export-pdf", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;

    if (!year || month === undefined || month === "") return res.status(400).json({ message: "Year and month are required" });

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, parseInt(month) + 1, 1, 0, 0, 0, 0);

    const transactions = await Transaction.find({
      createdBy: userId,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    const income = transactions.filter(t => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type !== "Income").reduce((s, t) => s + t.amount, 0);
    const profit = income - expenses;
    const totalVolume = income + expenses;
    const compliance = totalVolume > 0 ? Math.min(100, Math.max(0, (income / totalVolume) * 100)) : 100;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month)] || "Unknown";

    const workersRecords = await Worker.find({ createdBy: userId });

    // Build a text-based report
    let report = "";
    report += "═════════════════════════════════════════════════════════════\n";
    report += `              BUILDTRACK FINANCIAL REPORT\n`;
    report += `              ${monthName} ${year}\n`;
    report += "═════════════════════════════════════════════════════════════\n\n";
    report += "  SUMMARY\n";
    report += "  ─────────────────────────────────────────────────\n";
    report += `  Total Income:       ₹${income.toLocaleString("en-IN")}\n`;
    report += `  Total Expenses:     ₹${expenses.toLocaleString("en-IN")}\n`;
    report += `  Net Profit:         ₹${profit.toLocaleString("en-IN")}\n`;
    report += `  Compliance Score:   ${compliance.toFixed(1)}%\n`;
    report += `  Total Transactions: ${transactions.length}\n\n`;

    report += "  TRANSACTIONS\n";
    report += "  ─────────────────────────────────────────────────\n";
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString("en-IN");
      const sign = t.type === "Income" ? "+" : "-";
      const typeString = t.type ? t.type.padEnd(10) : "Unknown   ";
      const titleString = t.title || "";
      report += `  ${date}  ${sign}₹${t.amount.toLocaleString("en-IN")}  ${typeString}  ${titleString}\n`;
    });
    report += "\n";

    report += "  WORKER PAYROLL ESTIMATES\n";
    report += "  ─────────────────────────────────────────────────\n";
    workersRecords.forEach(w => {
      const monthly = (w.dailyWage || 0) * 26;
      report += `  ${(w.name || "Unknown").padEnd(20)} ${(w.trade || "").padEnd(15)} ₹${monthly.toLocaleString("en-IN")}/mo\n`;
    });
    report += "\n═════════════════════════════════════════════════════════════\n";
    report += "  Generated by BuildTrack on " + new Date().toLocaleDateString("en-IN") + "\n";

    const filename = `BuildTrack_Report_${monthName}_${year}.txt`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(report);
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ message: "Failed to export report" });
  }
});


module.exports = router;
