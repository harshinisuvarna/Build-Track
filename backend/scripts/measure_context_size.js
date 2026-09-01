const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected.');
  const Project = require('../models/Project');

  // Replicate the /context projection for ALL projects
  const t = Date.now();
  const all = await Project.find({})
    .select('projectName location status floors selectedPhases.id selectedPhases.phaseName selectedPhases.activities.id selectedPhases.activities.name')
    .lean();
  console.log('queried in', Date.now() - t, 'ms, projects:', all.length);
  const json = JSON.stringify(all);
  console.log('CONTEXT PAYLOAD SIZE:', (json.length / 1024).toFixed(2), 'KB');

  // compare with full payload
  const full = await Project.find({}).lean();
  console.log('FULL PAYLOAD SIZE:', (JSON.stringify(full).length / 1024 / 1024).toFixed(2), 'MB');

  await mongoose.disconnect();
}
run().catch((e) => { console.error('ERR', e); process.exit(1); });