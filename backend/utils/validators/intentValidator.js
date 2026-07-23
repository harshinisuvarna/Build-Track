const { SchemaType } = require("@google/generative-ai");
const { sanitizeIntentValues } = require("./aiSanitizer");

const geminiIntentSchema = {
  type: SchemaType.OBJECT,
  properties: {
    intent: {
      type: SchemaType.STRING,
      description: "The core intent: 'resource_report', 'budget_health', 'progress_report', 'pending_payments', 'inventory_status', 'comparison_report', or 'unknown'",
    },
    category: {
      type: SchemaType.STRING,
      description: "The resource category if applicable: 'material', 'labour', 'equipment', 'expense', or 'all'",
    },
    resourceName: {
      type: SchemaType.STRING,
      description: "Specific resource name if mentioned, e.g., 'UltraTech', 'Cement', 'Excavator'. Null if none.",
    },
    project: {
      type: SchemaType.STRING,
      description: "Project name(s). Can be a string, or a comma-separated string of multiple projects. Use 'all' if all projects are requested. Null if none.",
    },
    period: {
      type: SchemaType.STRING,
      description: "Date period: 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', or a specific range like '2023-01-01_to_2023-01-31'. Null if none.",
    },
    aggregation: {
      type: SchemaType.STRING,
      description: "How to aggregate data: 'summary', 'trend', 'project_wise', 'category_wise', 'resource_wise'",
    },
    comparison: {
      type: SchemaType.BOOLEAN,
      description: "Whether the user is asking for a comparison (e.g. this month vs last month)",
    },
    sort: {
      type: SchemaType.STRING,
      description: "Sort order: 'amount_desc', 'amount_asc', 'date_desc', 'date_asc', 'quantity_desc', 'quantity_asc'",
    },
    compareItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description: "Items to compare if intent is 'comparison_report', e.g. ['Ultratech', 'ACC']",
    },
    confidenceScore: {
      type: SchemaType.NUMBER,
      description: "A confidence score between 0.0 and 1.0 indicating how confident you are in this intent extraction",
    }
  },
  required: ["intent", "confidenceScore"],
};

function validateIntentOutput(parsedJson) {
  if (!parsedJson || typeof parsedJson !== "object") {
    return { isValid: false, error: "Output is not an object" };
  }

  const sanitizedJson = sanitizeIntentValues(parsedJson);

  if (!sanitizedJson.intent) {
    return { isValid: false, error: "Missing intent field" };
  }
  if (sanitizedJson.confidenceScore === undefined || typeof sanitizedJson.confidenceScore !== "number") {
    return { isValid: false, error: "Missing or invalid confidenceScore" };
  }

  sanitizedJson.category = sanitizedJson.category || "all";
  sanitizedJson.aggregation = sanitizedJson.aggregation || "summary";
  sanitizedJson.sort = sanitizedJson.sort || "date_desc";
  sanitizedJson.comparison = !!sanitizedJson.comparison;

  return { isValid: true, intent: sanitizedJson, sanitizedRaw: sanitizedJson };
}

module.exports = { geminiIntentSchema, validateIntentOutput };
