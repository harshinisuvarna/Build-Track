// backend/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const { protect } = require("../middleware/auth");

router.use(protect);

// ── Helper: compute date range from query params ──────────────────────────────
// Supports:
//   ?year=2025&month=2                               → full month
//   ?year=2025&month=2&rangeStart=ISO&rangeEnd=ISO   → custom range within month
function getDateRange(query) {
  const { year, month, rangeStart, rangeEnd } = query;

  if (rangeStart && rangeEnd) {
    return {
      startDate: new Date(rangeStart),
      endDate:   new Date(rangeEnd),
    };
  }

  return {
    startDate: new Date(year, month, 1, 0, 0, 0, 0),
    endDate:   new Date(year, parseInt(month) + 1, 1, 0, 0, 0, 0),
  };
}

// GET /api/reports/financial
// Query params: ?year=2025&month=2 (0-indexed month)
//           or: ?year=2025&month=2&rangeStart=ISO&rangeEnd=ISO
router.get("/financial", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;

    if (!year || month === undefined || month === "") return res.status(400).json({ message: "Year and month are required" });

    const { startDate, endDate } = getDateRange(req.query);

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

    // Calculate total working days in the range
    const rangeDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    // Approximate working days (exclude ~30% for weekends/holidays)
    const workingDays = Math.round(rangeDays * 0.86); // ~26 days per 30-day month

    const workersRecords = await Worker.find({ createdBy: userId });
    const workers = workersRecords.map((w) => ({
      _id: w._id,
      id: w._id,
      name: w.name,
      trade: w.trade,
      dailyWage: w.dailyWage,
      totalDays: workingDays,
      estimatedMonthlyPayout: (w.dailyWage || 0) * workingDays,
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

    const { startDate, endDate } = getDateRange(req.query);

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
// Returns a real PDF financial report generated with pdfkit
router.get("/financial/export-pdf", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;

    if (!year || month === undefined || month === "") return res.status(400).json({ message: "Year and month are required" });

    const { startDate, endDate } = getDateRange(req.query);

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

    // Calculate working days
    const rangeDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const workingDays = Math.round(rangeDays * 0.86);

    const filename = `BuildTrack_Report_${monthName}_${year}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // ── Build PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    const orange = "#ea580c";
    const dark = "#1a1a1a";
    const gray = "#666666";

    // ── Title ──
    doc.fontSize(22).fillColor(orange).text("BUILDTRACK", { align: "center" });
    doc.fontSize(10).fillColor(gray).text("Financial Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(dark).text(`${monthName} ${year}`, { align: "center" });
    doc.moveDown(0.3);

    // Horizontal rule
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e5e5").stroke();
    doc.moveDown(1);

    // ── Summary Section ──
    doc.fontSize(14).fillColor(dark).text("Financial Summary", { underline: true });
    doc.moveDown(0.5);

    const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;
    const summaryItems = [
      ["Total Income", fmt(income)],
      ["Total Expenses", fmt(expenses)],
      ["Net Profit", fmt(profit)],
      ["Compliance Score", `${compliance.toFixed(1)}%`],
      ["Total Transactions", `${transactions.length}`],
    ];

    summaryItems.forEach(([label, value]) => {
      doc.fontSize(11).fillColor(gray).text(label, 60, doc.y, { continued: true, width: 200 });
      doc.fillColor(dark).text(`   ${value}`);
      doc.moveDown(0.2);
    });

    doc.moveDown(1);

    // ── Transactions Table ──
    doc.fontSize(14).fillColor(dark).text("Transactions", { underline: true });
    doc.moveDown(0.5);

    if (transactions.length === 0) {
      doc.fontSize(11).fillColor(gray).text("No transactions for this period.");
    } else {
      // Table header
      const tableTop = doc.y;
      const colX = [60, 140, 250, 330, 420];
      doc.fontSize(9).fillColor(orange);
      doc.text("DATE", colX[0], tableTop);
      doc.text("TYPE", colX[1], tableTop);
      doc.text("TITLE", colX[2], tableTop);
      doc.text("AMOUNT", colX[3], tableTop);
      doc.text("WORKER", colX[4], tableTop);
      doc.moveDown(0.3);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ebebeb").stroke();
      doc.moveDown(0.3);

      transactions.forEach(t => {
        if (doc.y > 720) { doc.addPage(); }
        const date = new Date(t.date).toLocaleDateString("en-IN");
        const sign = t.type === "Income" ? "+" : "-";
        const y = doc.y;
        doc.fontSize(9).fillColor(dark);
        doc.text(date, colX[0], y, { width: 70 });
        doc.text(t.type || "—", colX[1], y, { width: 100 });
        doc.text((t.title || "—").substring(0, 25), colX[2], y, { width: 80 });
        doc.text(`${sign}${fmt(t.amount)}`, colX[3], y, { width: 80 });
        doc.text(t.worker || "—", colX[4], y, { width: 100 });
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);

    // ── Worker Payroll Estimates ──
    if (doc.y > 650) { doc.addPage(); }
    doc.fontSize(14).fillColor(dark).text("Worker Payroll Estimates", { underline: true });
    doc.moveDown(0.5);

    if (workersRecords.length === 0) {
      doc.fontSize(11).fillColor(gray).text("No workers found.");
    } else {
      // Header
      const wColX = [60, 200, 330, 430];
      doc.fontSize(9).fillColor(orange);
      doc.text("NAME", wColX[0], doc.y);
      doc.text("TRADE", wColX[1], doc.y);
      doc.text("DAILY RATE", wColX[2], doc.y);
      doc.text(`EST. MONTHLY (${workingDays}d)`, wColX[3], doc.y);
      doc.moveDown(0.3);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ebebeb").stroke();
      doc.moveDown(0.3);

      workersRecords.forEach(w => {
        if (doc.y > 720) { doc.addPage(); }
        const monthly = (w.dailyWage || 0) * workingDays;
        const y = doc.y;
        doc.fontSize(9).fillColor(dark);
        doc.text((w.name || "Unknown").substring(0, 30), wColX[0], y, { width: 130 });
        doc.text((w.trade || "—").substring(0, 25), wColX[1], y, { width: 120 });
        doc.text(fmt(w.dailyWage || 0), wColX[2], y, { width: 90 });
        doc.text(fmt(monthly), wColX[3], y, { width: 100 });
        doc.moveDown(0.5);
      });
    }

    // ── Footer ──
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e5e5").stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(gray)
      .text(`Generated by BuildTrack on ${new Date().toLocaleDateString("en-IN")}`, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ message: "Failed to export report" });
  }
});


module.exports = router;
