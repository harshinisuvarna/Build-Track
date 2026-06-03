const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
require("dotenv").config();

// Set public DNS servers to resolve MongoDB Atlas SRV queries if local ISP DNS fails
try {
  require("dns").setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("⚠️ Failed to set public DNS servers:", dnsErr.message);
}

async function runOwnershipMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    // Find the first admin user as a fallback owner if one is missing
    const firstAdmin = await User.findOne({ role: "Admin" });
    if (!firstAdmin) {
      console.error("❌ No Admin user found in the database. Please create an Admin user first.");
      process.exit(1);
    }
    console.log(`Using fallback Admin user: ${firstAdmin.email} (${firstAdmin._id})`);

    const projects = await Project.find({});
    console.log(`Found ${projects.length} total projects. Auditing ownership...`);

    let patchedCount = 0;
    for (const project of projects) {
      if (!project.createdBy) {
        console.log(`⚠️ Project "${project.projectName}" (${project._id}) is missing 'createdBy'. Assigning to Admin.`);
        project.createdBy = firstAdmin._id;
        await project.save();
        patchedCount++;
      } else {
        // Verify if the owner exists in the database
        const ownerExists = await User.findById(project.createdBy);
        if (!ownerExists) {
          console.log(`⚠️ Project "${project.projectName}" (${project._id}) has orphan owner ID "${project.createdBy}". Re-assigning to Admin.`);
          project.createdBy = firstAdmin._id;
          await project.save();
          patchedCount++;
        }
      }
    }

    console.log(`✅ Ownership audit complete. Patched ${patchedCount} legacy projects.`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Ownership migration failed:", error);
    process.exit(1);
  }
}

runOwnershipMigration();
