const mongoose = require("mongoose");
const fs = require("fs");

const envPath = "c:\\Build-Track\\backend\\.env";
if (!fs.existsSync(envPath)) {
  console.error("Error: backend .env file not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
let mongoUri = "";
envContent.split("\n").forEach((line) => {
  if (line.startsWith("MONGO_URI=")) {
    mongoUri = line.replace("MONGO_URI=", "").trim();
  }
});

if (!mongoUri) {
  console.error("Error: MONGO_URI not found!");
  process.exit(1);
}

const ProjectSchema = new mongoose.Schema({}, { strict: false });
const TransactionSchema = new mongoose.Schema({}, { strict: false });

const Project = mongoose.model("Project", ProjectSchema);
const Transaction = mongoose.model("Transaction", TransactionSchema);

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const projects = await Project.find({}).lean();
    console.log("=== PROJECTS ===");
    projects.forEach(p => {
      console.log(`ID: ${p._id}, Name: ${p.projectName || p.name}, projectCode: ${p.projectCode}`);
    });

    const txs = await Transaction.find({}).lean();
    console.log("\n=== TRANSACTIONS ===");
    txs.forEach(t => {
      console.log(`ID: ${t._id}, Title: ${t.title || t.materialName}, Project field: ${t.project}, ProjectId field: ${t.projectId}, Category: ${t.category}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
