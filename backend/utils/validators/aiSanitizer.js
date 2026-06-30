/**
 * Recursively sanitizes JSON objects to ensure empty strings, "null" strings, 
 * and placeholder values are converted to proper JavaScript `null`.
 */
function sanitizeIntentValues(obj) {
  if (obj === null || obj === undefined) return null;
  
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    const lower = trimmed.toLowerCase();
    
    // Check for common AI hallucinated placeholder strings
    if (lower === "null" || lower === "undefined" || lower === "none" || 
        lower === "nil" || lower === "n/a" || lower === "") {
      return null;
    }
    return trimmed;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeIntentValues(item));
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj = {};
    for (const key in obj) {
      sanitizedObj[key] = sanitizeIntentValues(obj[key]);
    }
    return sanitizedObj;
  }
  
  return obj;
}

module.exports = { sanitizeIntentValues };
