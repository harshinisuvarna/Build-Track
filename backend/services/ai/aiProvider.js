class AIProvider {

  async generateIntent(query, context, schema) {
    throw new Error("Method 'generateIntent' must be implemented.");
  }

  async generateSummary(analyticsData, userQuery) {
    throw new Error("Method 'generateSummary' must be implemented.");
  }

  async generateFollowups(currentContext) {
    throw new Error("Method 'generateFollowups' must be implemented.");
  }
}

module.exports = AIProvider;
