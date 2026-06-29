const path = require('path');
require('dotenv').config({ path: 'C:/Build-Track/backend/.env' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

const Transaction = require('C:/Build-Track/backend/models/Transaction');

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  const tx = await Transaction.findById('6a3d058eaa0b0161235ae1dc');
  console.log('Transaction details:', JSON.stringify(tx, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
