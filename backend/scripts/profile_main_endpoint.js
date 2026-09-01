const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI;

async function time(label, fn) {
  const t = Date.now();
  const out = await fn();
  console.log(`${label}: ${Date.now() - t}ms`);
  return out;
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const User = require('../models/User');
  const Project = require('../models/Project');
  const Transaction = require('../models/Transaction');
  const Task = require('../models/Task');

  const users = await User.find({}).select('_id role').lean();
  const admin = users.find(u => u.role === 'Admin');
  console.log('total users:', users.length, '| buildAdmin:', admin?._id?.toString());

  let exec = { _id: admin?._id || null, createdBy: admin?._id || null };

  await time('  warmup user count', () => User.estimatedDocumentCount());

  // Number of projects & transactions
  const projCount = await time('project count', () => Project.countDocuments({ createdBy: exec._id }));
  const txCount = await time('tx count (all)', () => Transaction.countDocuments({}));
  const taskCount = await time('task count', () => Task.countDocuments({}));
  console.log(`projects(createdBy admin): ${projCount}, transactions total: ${txCount}, tasks total: ${taskCount}`);

  // Main GET / query profile
  const taskIds = await time('  task.find', () => Task.find({ assignedTo: exec._id }).select('project').lean());
  let q = { createdBy: exec._id };
  if (taskIds.length) q._id = { $in: taskIds.map(t => t.project).filter(Boolean) };

  const projects = await time('  project.find (full)', () => Project.find(q).sort({ createdAt: -1 }).lean());
  console.log('  projects returned:', projects.length);
  if (projects.length) {
    const p = projects[0];
    const phases = p.selectedPhases || [];
    const acts = phases.reduce((s, ph) => s + (ph.activities || []).length, 0);
    console.log('  biggest project phases:', phases.length, 'activities:', acts, 'JSON KB:', (JSON.stringify(p).length/1024).toFixed(1));
  }
  const ids = projects.map(p => p._id);
  await time('  aggregate spent', () => Transaction.aggregate([
    { $match: { project: { $in: ids }, type: { $in: ["Expense", "Wages", "Materials", "Equipment"] } } },
    { $group: { _id: "$project", totalSpent: { $sum: "$amount" } } }
  ]));
  await time('  aggregate income', () => Transaction.aggregate([
    { $match: { project: { $in: ids }, type: "Income" } },
    { $group: { _id: "$project", totalIncome: { $sum: "$amount" } } }
  ]));

  // Index check on transactions
  await time('  tx collection index stats', async () => {
    try {
      const info = await Transaction.collection.indexes();
      console.log('  tx indexes:', info.map(i => i.name + (i.key ? ':' + JSON.stringify(i.key) : '')).join(' | '));
    } catch (e) { console.log('  index stats err', e.message); }
  });

  await mongoose.disconnect();
}
run().catch((e) => { console.error('ERR', e); process.exit(1); });