class AIProvider {
  /**
   * Generates a structured JSON intent from a natural language query.
   * @param {string} query - The user's natural language query.
   * @param {Object} context - Contextual information (e.g., project list, previous intent).
   * @param {Object} schema - The expected JSON schema for the intent.
   * @returns {Promise<Object>} The parsed intent.
   */
  async generateIntent(query, context, schema) {
    throw new Error("Method 'generateIntent' must be implemented.");
  }

  /**
   * Generates a concise executive summary based on analytics data.
   * @param {Object} analyticsData - The computed analytics data.
   * @param {string} userQuery - The original user query.
   * @returns {Promise<string>} The generated summary.
   */
  async generateSummary(analyticsData, userQuery) {
    throw new Error("Method 'generateSummary' must be implemented.");
  }

  /**
   * Generates follow-up suggestions based on the current context.
   * @param {Object} currentContext - The current reporting context.
   * @returns {Promise<string[]>} An array of suggested questions/actions.
   */
  async generateFollowups(currentContext) {
    throw new Error("Method 'generateFollowups' must be implemented.");
  }
}

module.exports = AIProvider;
