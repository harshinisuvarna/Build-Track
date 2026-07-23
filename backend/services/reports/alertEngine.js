const Transaction = require("../../models/Transaction");

async function generateAlerts(intent, analyticsData, baseScope) {
  const alerts = [];

  if (intent.intent === "inventory_status") {

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0,0,0,0);

    const aggPipeline = [
      {
        $match: {
          type: "Materials",
          createdBy: baseScope.adminId,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $toLower: { $cond: [{ $ifNull: ["$subType", false] }, "$subType", "$title"] } },
          totalUsed: { $sum: "$quantity" }
        }
      }
    ];

    const usageResult = await Transaction.aggregate(aggPipeline);
    const usageMap = {};
    usageResult.forEach(u => {
      if (u._id) usageMap[u._id] = u.totalUsed;
    });

    if (analyticsData.inventoryRows && analyticsData.inventoryRows.length > 0) {
      for (const row of analyticsData.inventoryRows) {
        if (row.severity === "critical") {
          alerts.push({
            type: "warning",
            message: `${row.name} is critically low: only ${row.quantity} ${row.unit || 'units'} remaining`
          });
        }

        const materialKey = row.name.toLowerCase();
        const totalUsedLast30Days = usageMap[materialKey] || 0;
        const avgDailyConsumption = totalUsedLast30Days / 30;

        if (avgDailyConsumption > 0) {
          const daysRemaining = Math.floor(row.quantity / avgDailyConsumption);
          if (daysRemaining < 15) {
            alerts.push({
              type: "critical",
              message: `At current usage rate, ${row.name} will run out in ~${daysRemaining} days`
            });
          }
        }
      }
    }
  }

  if (intent.intent === "resource_report" && analyticsData.totalAmount > 0) {

     const now = new Date();
     let currentStart = new Date(now);
     currentStart.setDate(now.getDate() - 30);

     if (intent.period === "this_month") {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
     } else if (intent.period === "last_month") {
        currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
     } else if (intent.period === "this_week") {
        currentStart = new Date(); currentStart.setDate(currentStart.getDate() - 6);
     }

     const diffTime = Math.abs(now - currentStart);
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

     const prevStart = new Date(currentStart);
     prevStart.setDate(prevStart.getDate() - diffDays);
     const prevEnd = new Date(currentStart);
     prevEnd.setDate(prevEnd.getDate() - 1);

     const prevQuery = {
       ...baseScope.txScope,
       date: { $gte: prevStart, $lte: prevEnd }
     };

     if (intent.category === "material") prevQuery.type = "Materials";
     else if (intent.category === "labour") prevQuery.type = "Wages";
     else if (intent.category === "equipment") prevQuery.type = "Equipment";
     else if (intent.category === "expense") prevQuery.type = "Expense";

     if (intent.resourceName && typeof intent.resourceName === 'string') {
        prevQuery.$or = [
            { title: { $regex: new RegExp(intent.resourceName, "i") } },
            { subType: { $regex: new RegExp(intent.resourceName, "i") } },
            { brand: { $regex: new RegExp(intent.resourceName, "i") } },
            { materialType: { $regex: new RegExp(intent.resourceName, "i") } }
        ];
     }

     const prevAgg = await Transaction.aggregate([
       { $match: prevQuery },
       { $group: { _id: null, total: { $sum: "$amount" } } }
     ]);

     const previousTotal = prevAgg.length > 0 ? prevAgg[0].total : 0;

     if (previousTotal > 0 && analyticsData.totalAmount > previousTotal * 1.3) {
        alerts.push({
          type: "warning",
          message: `Costs are 30%+ higher than the previous period. Review recent transactions.`
        });
     }
  }

  return { alerts };
}

module.exports = { generateAlerts };
