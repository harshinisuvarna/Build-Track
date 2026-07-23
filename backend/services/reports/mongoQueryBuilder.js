const Project = require("../../models/Project");
const aiDebugLogger = require("../../utils/aiDebugLogger");

function parseDateWindow(periodStr) {
  const now = new Date();
  const year = now.getFullYear();

  const default30Days = () => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    const start = new Date(d.setHours(0,0,0,0));
    const end = new Date(new Date().setHours(23,59,59,999));
    return { start, end };
  };

  if (!periodStr) return default30Days();

  if (periodStr === "today") {
    const start = new Date(now.setHours(0,0,0,0));
    const end = new Date(now.setHours(23,59,59,999));
    return { start, end };
  }
  if (periodStr === "yesterday") {
    const d = new Date(); d.setDate(d.getDate() - 1);
    const start = new Date(d.setHours(0,0,0,0));
    const end = new Date(d.setHours(23,59,59,999));
    return { start, end };
  }
  if (periodStr === "this_week") {
    const d = new Date(); d.setDate(d.getDate() - 6);
    const start = new Date(d.setHours(0,0,0,0));
    const end = new Date(now.setHours(23,59,59,999));
    return { start, end };
  }
  if (periodStr === "this_month") {
    const start = new Date(year, now.getMonth(), 1);
    const end = new Date(now.setHours(23,59,59,999));
    return { start, end };
  }
  if (periodStr === "last_month") {
    const start = new Date(year, now.getMonth() - 1, 1);
    const end = new Date(year, now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (periodStr === "this_year") {
    const start = new Date(year, 0, 1);
    const end = new Date(now.setHours(23,59,59,999));
    return { start, end };
  }

  if (periodStr.includes("_to_")) {
    const parts = periodStr.split("_to_");
    if (parts.length === 2) {
      const start = new Date(parts[0]);
      const end = new Date(parts[1]);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return { start, end };
      }
    }
  }

  return default30Days();
}

async function validateEntities(intent, baseScope, reqId) {
   let resolvedProjectId = null;

   if (intent.project && intent.project !== "all") {
      const projectNames = (Array.isArray(intent.project) ? intent.project : intent.project.split(/,| and /i))
        .map(s => s.trim())
        .filter(Boolean);

      const resolvedIds = [];
      const resolvedNames = [];

      for (const pName of projectNames) {
         let pQuery = { ...baseScope.projectFilter };
         if (pName.match(/^[0-9a-fA-F]{24}$/)) {
            pQuery._id = pName;
         } else {
            pQuery.projectName = { $regex: new RegExp(pName, "i") };
         }
         const projectDoc = await Project.findOne(pQuery).select("_id projectName").lean();
         if (projectDoc) {
            resolvedIds.push(projectDoc._id.toString());
            resolvedNames.push(projectDoc.projectName);
         }
      }

      if (resolvedIds.length === 0) {
         throw new Error(`Project(s) '${intent.project}' not found or access denied.`);
      } else if (resolvedIds.length === 1) {
         resolvedProjectId = resolvedIds[0];
         intent.resolvedProjectName = resolvedNames[0];
      } else {
         resolvedProjectId = { $in: resolvedIds };
         intent.resolvedProjectName = resolvedNames.join(", ");
      }
    }

   aiDebugLogger.logSection("PROJECT RESOLUTION", {
      "Incoming projectId": intent.project || "N/A",
      "Resolved Mongo ObjectId": resolvedProjectId || "N/A",
      "Resolved project name": intent.resolvedProjectName || "N/A",
      "Validation result": resolvedProjectId ? "Success" : (intent.project && intent.project !== "all" ? "Failed" : "N/A (All projects)")
   }, reqId);
   return resolvedProjectId;
}

async function buildQuery(intent, baseScope, reqId) {
   aiDebugLogger.logEnter("Mongo Query Builder", reqId);
   const startTime = Date.now();

   try {
      const query = { ...baseScope.txScope };

   const resolvedProjectId = await validateEntities(intent, baseScope, reqId);
   if (resolvedProjectId) {
      query.project = resolvedProjectId;
   } else if (baseScope.projectScopeIds) {

      query.project = { $in: baseScope.projectScopeIds };
   }

   const dateWindow = parseDateWindow(intent.period);
   if (dateWindow) {
      query.date = { $gte: dateWindow.start, $lte: dateWindow.end };
   }

   const cat = intent.category?.toLowerCase();
   const isInventory =
      intent.intent === "inventory_status" ||
      (intent.intent === "resource_report" && ["labour", "labor", "workers", "wages", "manpower", "equipment", "equipments", "machinery", "machine", "vehicle", "material", "materials", null, undefined, "", "all"].includes(cat));

   if (isInventory) {
      intent.intent = "inventory_status";

      const invQuery = { project: { $in: baseScope.projectScopeIds } };
      if (resolvedProjectId) {
         invQuery.project = resolvedProjectId;
      } else if (baseScope.projectScopeIds) {
         invQuery.project = { $in: baseScope.projectScopeIds };
      }

      if (cat === "labour" || cat === "labor" || cat === "workers" || cat === "wages" || cat === "manpower") {
         invQuery.category = "labour";
      } else if (cat === "equipment" || cat === "equipments" || cat === "machinery" || cat === "machine" || cat === "vehicle") {
         invQuery.category = "equipment";
      } else if (cat === "material" || cat === "materials") {
         invQuery.category = "material";
      }

      if (intent.resourceName && typeof intent.resourceName === 'string' && intent.resourceName.trim().length > 0) {
         const lowerRes = intent.resourceName.trim().toLowerCase();
         if (!["null", "undefined", "none", "nil", "n/a"].includes(lowerRes)) {
            invQuery.materialName = { $regex: new RegExp(intent.resourceName.trim(), "i") };
         }
      }

      aiDebugLogger.logSection("MONGO QUERY BUILDER", {
         "Final Mongo filter": invQuery,
         Sort: "Default",
         Limit: "None",
         "Collection being queried": "inventories",
         "Date field used": "None"
      }, reqId);

      aiDebugLogger.logExit("Mongo Query Builder", reqId);
      return invQuery;
   }

   aiDebugLogger.logSection("DATE RESOLUTION", {
      "Current server time": new Date().toISOString(),
      "Detected period": intent.period || "None",
      "Calculated start date": dateWindow ? dateWindow.start.toISOString() : "N/A",
      "Calculated end date": dateWindow ? dateWindow.end.toISOString() : "N/A",
      Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      "Utility responsible": "parseDateWindow (mongoQueryBuilder.js)"
   }, reqId);

   const typeMap = {
     "material": "Materials",
     "materials": "Materials",
     "labour": "Wages",
     "labor": "Wages",
     "wages": "Wages",
     "worker": "Wages",
     "workers": "Wages",
     "manpower": "Wages",
     "equipment": "Equipment",
     "equipments": "Equipment",
     "machinery": "Equipment",
     "machine": "Equipment",
     "vehicle": "Equipment",
     "expense": "Expense",
     "expenses": "Expense",
   };

   const mappedType = typeMap[intent.category?.toLowerCase()];
   if (mappedType) query.type = mappedType;

   if (intent.resourceName && typeof intent.resourceName === 'string' && intent.resourceName.trim().length > 0) {
      const lowerRes = intent.resourceName.trim().toLowerCase();
      if (!["null", "undefined", "none", "nil", "n/a"].includes(lowerRes)) {
         const regex = new RegExp(intent.resourceName.trim(), "i");
         query.$or = [
            { title: { $regex: regex } },
            { subType: { $regex: regex } },
            { brand: { $regex: regex } },
            { materialType: { $regex: regex } },
            { category: { $regex: regex } }
         ];
      }
   }

   if (intent.intent === "pending_payments") {
      query.paymentStatus = { $in: ["Pending", "Partial"] };
   }

   aiDebugLogger.logSection("MONGO QUERY BUILDER", {
      "Final Mongo filter": query,
      Sort: "Default (implicit/latest)",
      Limit: "None (Aggregation limit applies)",
      "Collection being queried": intent.intent === "inventory_status" ? "inventories" : "transactions",
      "Date field used": query.date ? "date" : "None"
   }, reqId);

   aiDebugLogger.logExit("Mongo Query Builder", reqId);
   return query;

   } catch (error) {
      aiDebugLogger.logError("Mongo Query Builder", error, reqId, Date.now() - startTime);
      throw error;
   }
}

module.exports = { buildQuery, parseDateWindow };
