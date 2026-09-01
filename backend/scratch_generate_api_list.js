const fs = require('fs');

const routes = {
  'authRoutes.js': '/api/auth',
  'userRoutes.js': '/api/users',
  'workerRoutes.js': '/api/workers',
  'projectRoutes.js': '/api/projects',
  'transactionRoutes.js': '/api/transactions',
  'esignRoutes.js': '/api/esign',
  'inventoryRoutes.js': '/api/inventory',
  'dashboardRoutes.js': '/api/dashboard',
  'reportRoutes.js': '/api/reports',
  'aiReportRoutes.js': '/api/reports',
  'aiDashboardRoutes.js': '/api/reports/dashboard',
  'voiceRoutes.js': '/api/voice',
  'projectUpdateRoutes.js': '/api/project-updates',
  'taskRoutes.js': '/api/tasks',
  'approvalsRoutes.js': '/api/approvals',
  'subscriptionRoutes.js': '/api/subscriptions',
  'analyticsRoutes.js': '/api/analytics' // Not listed in main but it exists
};

const jsonStr = fs.readFileSync('C:/Users/Muneesha/.gemini/antigravity/brain/9b86d633-0fe1-43cd-9a32-4ff09db0fa86/.system_generated/tasks/task-21.log', 'utf8');
const data = JSON.parse(jsonStr);

let markdown = '# BuildTrack API Routes\n\nThis document lists all the identified API endpoints within the BuildTrack backend.\n\n';
markdown += '| Method | Endpoint | File | Line |\n|---|---|---|---|\n';

data.forEach(item => {
    const filename = item.Path.split('\\').pop();
    const base = routes[filename] || '/api/unknown';
    
    // Extract method and path
    // e.g. router.get("/financial/export-pdf", async (req, res) => {
    const match = item.Line.match(/router\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/);
    if (match) {
        const method = match[1].toUpperCase();
        let path = match[2];
        if (path === '/') path = '';
        
        const fullPath = (base + path).replace(/\/+/g, '/');
        
        markdown += `| **${method}** | \`${fullPath}\` | [${filename}](file:///c:/build-track/Build-Track/backend/routes/${filename}#L${item.LineNumber}) | ${item.LineNumber} |\n`;
    } else {
        // e.g. router.put(
        markdown += `| **UNKNOWN** | \`Could not parse\` | [${filename}](file:///c:/build-track/Build-Track/backend/routes/${filename}#L${item.LineNumber}) | ${item.LineNumber} |\n`;
    }
});

fs.writeFileSync('C:/Users/Muneesha/.gemini/antigravity/brain/9b86d633-0fe1-43cd-9a32-4ff09db0fa86/buildtrack_api_list.md', markdown);
console.log('Artifact created successfully.');
