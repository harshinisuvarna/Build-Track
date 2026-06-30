const AI_DEBUG = process.env.AI_DEBUG === 'true';

const aiDebugLogger = {
  logSection: (title, contentObj, reqId = 'GLOBAL') => {
    if (!AI_DEBUG) return;
    console.log(`\n==============================\n[AI][${reqId}] ${title}\n${'='.repeat(title.length + reqId.length + 7)}\n`);
    if (contentObj !== undefined) {
      if (typeof contentObj === 'string') {
        console.log(contentObj);
      } else {
        console.log(JSON.stringify(contentObj, null, 2));
      }
    }
  },
  
  logEnter: (stage, reqId) => {
    if (!AI_DEBUG) return;
    console.log(`\n[AI][${reqId}] ENTER ${stage}`);
  },

  logExit: (stage, reqId) => {
    if (!AI_DEBUG) return;
    console.log(`\n[AI][${reqId}] EXIT ${stage}`);
  },

  logError: (stage, error, reqId, elapsedTimeMs = null) => {
    if (!AI_DEBUG) return;
    console.log(`\n==============================\n[AI][${reqId}] ERROR IN STAGE: ${stage}\n==============================\n`);
    console.log(`Exception Type: ${error.name || 'Unknown'}`);
    console.log(`Exception Message: ${error.message}`);
    if (elapsedTimeMs !== null) {
      console.log(`Elapsed Time: ${elapsedTimeMs}ms`);
    }
    console.log(`Stack Trace:\n${error.stack || 'No stack trace available'}`);
  },

  logRaw: (...args) => {
    if (!AI_DEBUG) return;
    console.log(...args);
  },
  
  isActive: () => AI_DEBUG
};

module.exports = aiDebugLogger;
