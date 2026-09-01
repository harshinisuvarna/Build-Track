const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const User = require('../models/User');
  const Project = require('../models/Project');

  // Distribution of projects by creator
  const projByUser = await Project.aggregate([
    { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log('Projects per creator:');
  for (const row of projByUser) {
    const u = await User.findById(row._id).select('email role').lean();
    console.log(`  ${row.count} project(s) | ${row._id} | ${u?.email || '?'} | ${u?.role || '?'}`);
  }

  // Biggest projects by selectedPhases/activities
  const projects = await Project.find({}).select('projectName selectedPhases createdAt').lean();
  const sized = projects.map(p => ({
    id: p._id.toString(),
    name: p.projectName,
    phases: (p.selectedPhases || []).length,
    activities: (p.selectedPhases || []).reduce((s, ph) => s + (ph.activities || []).length, 0),
    kb: (JSON.stringify(p).length / 1024).toFixed(1),
    createdAt: p.createdAt,
  })).sort((a, b) => b.activities - a.activities);

  console.log('\nTotal projects:', projects.length);
  console.log('Top 8 by activity count:');
  sized.slice(0, 8).forEach(s => console.log(`  ${s.activities} activities / ${s.phases} phases | ${s.kb}KB | ${s.name} (${s.id})`));

  // Sum everything
  const totalKB = (JSON.stringify(projects).length / 1024 / 1024).toFixed(2);
  console.log('\nAll projects serialized size: ', totalKB, 'MB');

  await mongoose.disconnect();
}
run().catch((e) => { console.error('ERR', e); process.exit(1); });