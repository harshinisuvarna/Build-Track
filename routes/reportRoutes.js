const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const Transaction = require("../models/Transaction");
const Worker = require("../models/Worker");
const Project = require("../models/Project");
const { protect } = require("../middleware/auth");
router.use(protect);
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
    endDate:   new Date(year, parseInt(month) + 1, 0, 23, 59, 59, 999),
  };
}
function formatINR(n) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}
function normalizeProjectStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "on track" || s === "completed") return "ON TRACK";
  if (s === "review needed" || s === "on hold") return "REVIEW NEEDED";
  return "IN PROGRESS";
}
router.get("/financial", async (req, res) => {
  try {
    const { year, month, type, category, project } = req.query;
    const userId = req.user._id;

    const { startDate, endDate } = getDateRange(req.query);

    const query = {
      createdBy: userId,
      date: { $gte: startDate, $lte: endDate },
    };

    if (type)     query.type = type;
    if (category) query.category = category;
    if (project)  query.project = project;

    const transactions = await Transaction.find(query)
      .populate("project", "projectName status")
      .populate("worker", "_id name trade dailyWage");

    const income = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type !== "Income")
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = income - expenses;
    const totalVolume = income + expenses;
    const compliance = totalVolume > 0
      ? Math.min(100, Math.max(0, (income / totalVolume) * 100))
      : 100;

    const workersRecords = await Worker.find({ createdBy: userId });
    const projects = await Project.find({ createdBy: userId });
    
    // Wage Calculation Logic
    const wageTransactions = transactions.filter((t) => t.type === "Wages");
    const workerStats = {};

    wageTransactions.forEach((t) => {
      const wId = t.worker?._id?.toString() || t.worker?.toString();
      if (!wId) return;
      if (!workerStats[wId]) {
        workerStats[wId] = {
          totalPayout: 0,
          daySet: new Set(),
          project: null,
        };
      }
      workerStats[wId].totalPayout += Number(t.amount || 0);
      workerStats[wId].daySet.add(new Date(t.date).toISOString().slice(0, 10));
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
          estimatedMonthlyPayout: stats.totalPayout,
          project: stats.project?.projectName || "Various",
          projectStatus: normalizeProjectStatus(stats.project?.status),
        };
      });

    // Category Breakdown Calculation
    let categoryBreakdown = {};
    const materials = transactions.filter(t => t.type === "Materials");
    materials.forEach(t => {
      const cat = t.category || "Uncategorized";
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = 0;
      categoryBreakdown[cat] += t.amount;
    });

    res.json({
      income,
      expenses,
      profit,
      compliance,
      workers,
      categoryBreakdown,
      transactionCount: transactions.length
    });
  } catch (err) {
    console.error("Financial report error:", err);
    res.status(500).json({ message: "Failed to fetch financial report" });
  }
});

router.get("/financial/export-csv", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;
    if (!year || month === undefined || month === "") {
      return res.status(400).json({ message: "Year and month are required" });
    }
    const { startDate, endDate } = getDateRange(req.query);
    const rangeDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const workingDays = Math.round(rangeDays * 0.86);
    const workersRecords = await Worker.find({ createdBy: userId });
    const wageTransactions = await Transaction.find({
      createdBy: userId,
      type: "Wages",
      date: { $gte: startDate, $lte: endDate },
    });
    const workerWageMap = {};
    wageTransactions.forEach((t) => {
      const wId = t.worker?.toString();
      if (wId) {
        if (!workerWageMap[wId]) workerWageMap[wId] = 0;
        workerWageMap[wId] += t.amount;
      }
    });
    const header = "Worker Name,Role,Project,Total Days,Daily Rate,Total Payout\n";
    const rows = workersRecords.map((w) => {
      const name = `"${(w.name || "").replace(/"/g, '""')}"`;
      const trade = `"${(w.trade || "General Labor").replace(/"/g, '""')}"`;
      const project = `"Various"`;
      const totalDays = workingDays;
      const rate = w.dailyWage || 0;
      const actualPayout = workerWageMap[w._id.toString()] || 0;
      const payout = actualPayout > 0 ? actualPayout : rate * workingDays;
      return `${name},${trade},${project},${totalDays},${rate},${payout}`;
    }).join("\n");
    const csv = header + rows;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const filename = `BuildTrack_Wages_${monthNames[parseInt(month)]}_${year}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Failed to export CSV" });
  }
});
router.get("/financial/export-pdf", async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user._id;
    if (!year || month === undefined || month === "") {
      return res.status(400).json({ message: "Year and month are required" });
    }
    const { startDate, endDate } = getDateRange(req.query);
    const transactions = await Transaction.find({
      createdBy: userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });
    const income = transactions.filter(t => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type !== "Income").reduce((s, t) => s + t.amount, 0);
    const profit = income - expenses;
    const totalVolume = income + expenses;
    const compliance = totalVolume > 0 ? Math.min(100, Math.max(0, (income / totalVolume) * 100)) : 100;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[parseInt(month)] || "Unknown";
    const workersRecords = await Worker.find({ createdBy: userId });
    const rangeDays = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const workingDays = Math.round(rangeDays * 0.86);
    const wageTransactions = transactions.filter(t => t.type === "Wages");
    const workerWageMap = {};
    wageTransactions.forEach((t) => {
      const wId = t.worker?.toString();
      if (wId) {
        if (!workerWageMap[wId]) workerWageMap[wId] = 0;
        workerWageMap[wId] += t.amount;
      }
    });
    const filename = `BuildTrack_Report_${monthName}_${year}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);
    const orange = "#ea580c";
    const dark = "#1a1a1a";
    const gray = "#666666";
    doc.fontSize(22).fillColor(orange).text("BUILDTRACK", { align: "center" });
    doc.fontSize(10).fillColor(gray).text("Financial Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor(dark).text(`${monthName} ${year} Analysis`, { align: "center" });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e5e5").stroke();
    doc.moveDown(1);
    doc.fontSize(14).fillColor(dark).text("Financial Summary", { underline: true });
    doc.moveDown(0.5);
    const summaryItems = [
      ["Total Income", formatINR(income)],
      ["Expenditures", formatINR(expenses)],
      ["Net Profit", formatINR(profit)],
      ["Profit Margin", income > 0 ? `${((profit / income) * 100).toFixed(1)}%` : "0.0%"],
      ["Compliance Score", `${compliance.toFixed(1)}%`],
      ["Total Transactions", `${transactions.length}`],
    ];
    summaryItems.forEach(([label, value]) => {
      doc.fontSize(11).fillColor(gray).text(label, 60, doc.y, { continued: true, width: 200 });
      doc.fillColor(dark).text(`   ${value}`);
      doc.moveDown(0.2);
    });
    doc.moveDown(1.5);
    if (doc.y > 550) { doc.addPage(); }
    doc.fontSize(14).fillColor(dark).text("Wages Per Worker", { underline: true });
    doc.moveDown(0.5);
    if (workersRecords.length === 0) {
      doc.fontSize(11).fillColor(gray).text("No workers found.");
    } else {
      const wColX = [50, 180, 280, 350, 410, 480];
      const headerY = doc.y;
      doc.fontSize(8).fillColor(orange);
      doc.text("WORKER NAME", wColX[0], headerY);
      doc.text("ROLE", wColX[1], headerY);
      doc.text("PROJECT", wColX[2], headerY);
      doc.text("DAYS", wColX[3], headerY);
      doc.text("RATE", wColX[4], headerY);
      doc.text("TOTAL PAYOUT", wColX[5], headerY);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(555, doc.y).strokeColor("#ebebeb").stroke();
      doc.moveDown(0.3);
      workersRecords.forEach(w => {
        if (doc.y > 720) { doc.addPage(); }
        const actualPayout = workerWageMap[w._id.toString()] || 0;
        const payout = actualPayout > 0 ? actualPayout : (w.dailyWage || 0) * workingDays;
        const y = doc.y;
        doc.fontSize(9).fillColor(dark);
        doc.text((w.name || "Unknown").substring(0, 22), wColX[0], y, { width: 125 });
        doc.text((w.trade || "—").substring(0, 18), wColX[1], y, { width: 95 });
        doc.text("Various", wColX[2], y, { width: 65 });
        doc.text(`${workingDays}d`, wColX[3], y, { width: 55 });
        doc.text(formatINR(w.dailyWage || 0), wColX[4], y, { width: 65 });
        doc.text(formatINR(payout), wColX[5], y, { width: 80 });
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(1);
    if (doc.y > 600) { doc.addPage(); }
    doc.fontSize(14).fillColor(dark).text("Transactions", { underline: true });
    doc.moveDown(0.5);
    if (transactions.length === 0) {
      doc.fontSize(11).fillColor(gray).text("No transactions for this period.");
    } else {
      const colX = [50, 130, 230, 320, 420];
      const thY = doc.y;
      doc.fontSize(8).fillColor(orange);
      doc.text("DATE", colX[0], thY);
      doc.text("TYPE", colX[1], thY);
      doc.text("TITLE", colX[2], thY);
      doc.text("AMOUNT", colX[3], thY);
      doc.text("NOTES", colX[4], thY);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(555, doc.y).strokeColor("#ebebeb").stroke();
      doc.moveDown(0.3);
      transactions.forEach(t => {
        if (doc.y > 720) { doc.addPage(); }
        const date = new Date(t.date).toLocaleDateString("en-IN");
        const sign = t.type === "Income" ? "+" : "-";
        const y = doc.y;
        doc.fontSize(9).fillColor(dark);
        doc.text(date, colX[0], y, { width: 75 });
        doc.text(t.type || "—", colX[1], y, { width: 90 });
        doc.text((t.title || "—").substring(0, 22), colX[2], y, { width: 85 });
        doc.text(`${sign}${formatINR(t.amount)}`, colX[3], y, { width: 90 });
        doc.text((t.notes || "—").substring(0, 20), colX[4], y, { width: 100 });
        doc.moveDown(0.5);
      });
    }
    doc.moveDown(2);
    if (doc.y > 750) { doc.addPage(); }
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e5e5").stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor(gray)
      .text(`Generated by BuildTrack on ${new Date().toLocaleDateString("en-IN")}`, { align: "center" });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Failed to export report" });
  }
});
module.exports = router;
