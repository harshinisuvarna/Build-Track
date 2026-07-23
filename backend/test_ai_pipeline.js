const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001/api/reports/dashboard/query';

async function runTests() {
  try {

    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');

    const adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
        console.error("No admin user found. Cannot run test.");
        process.exit(1);
    }

    console.log(`Using Admin: ${adminUser.email}`);

    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const headers = { Authorization: `Bearer ${token}` };

    const Project = require('./models/Project');
    const projects = await Project.find({ createdBy: adminUser._id }).select("projectName").limit(2);
    const proj1 = projects.length > 0 ? projects[0].projectName : "Skyline";
    const proj2 = projects.length > 1 ? projects[1].projectName : "Bajpe Towers";

    const queries = [
      "show me all materials project wise",
      `analyze ${proj1} and ${proj2}`,
      "show all labour",
      "show all equipment",
      "show JCB usage"
    ];

    for (const q of queries) {
      console.log(`\n===========================================`);
      console.log(`Testing Query: "${q}"`);
      console.log(`===========================================`);

      try {
        const res = await axios.post(BASE_URL, {
          query: q,
          projectId: "all"
        }, { headers });

        const data = res.data.data;
        console.log(`Intent: ${data.intent?.intent}`);
        console.log(`table rows count: ${data.table?.rows?.length}`);
        console.log(`projectBreakdown:`, JSON.stringify(data.charts?.projectBreakdown, null, 2));
      } catch (err) {
        console.log(`Test failed:`, err.response ? err.response.data : { error: err.message });
      }

      console.log(`Waiting 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
