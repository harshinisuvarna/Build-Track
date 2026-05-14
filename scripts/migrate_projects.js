const mongoose = require("mongoose");
const Project = require("../models/Project");
const ProjectConfig = require("../models/ProjectConfig");
require("dotenv").config();

async function runMigration() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        const projects = await Project.find({});
        console.log(`Found ${projects.length} existing projects. Migrating...`);

        for (const project of projects) {
            let isModified = false;

            // 1. Patch missing Project Code
            if (!project.projectCode) {
                project.projectCode = `PRJ-OLD-${Math.floor(Math.random() * 10000)}`;
                isModified = true;
            }

            // 2. Patch missing Building Type
            if (!project.buildingType || !project.buildingType.mainType) {
                project.buildingType = { mainType: "Residential", subType: "Legacy Update" };
                isModified = true;
            }

            // 3. FIX: Patch missing Client Name
            if (!project.clientName) {
                project.clientName = "Legacy Client";
                isModified = true;
            }

            // 4. FIX: Patch old "Active" status to match new Enums
            const validStatuses = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
            if (!validStatuses.includes(project.status)) {
                // If it was "Active", convert to "In Progress". Otherwise, default to "Planning"
                project.status = project.status === "Active" ? "In Progress" : "Planning";
                isModified = true;
            }

            // Save the patched project
            if (isModified) {
                await project.save();
                console.log(`Updated legacy schema fields for Project ID: ${project._id}`);
            }

            // Create the linked ProjectConfig document if it doesn't exist
            const existingConfig = await ProjectConfig.findOne({ project: project._id });
            if (!existingConfig) {
                await ProjectConfig.create({ project: project._id });
                console.log(`Created new ProjectConfig for Project ID: ${project._id}`);
            }
        }

        console.log("Migration completely successful.");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration();