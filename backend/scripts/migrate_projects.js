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

            if (!project.projectCode) {
                project.projectCode = `PRJ-OLD-${Math.floor(Math.random() * 10000)}`;
                isModified = true;
            }

            if (!project.buildingType || !project.buildingType.mainType) {
                project.buildingType = { mainType: "Residential", subType: "Legacy Update" };
                isModified = true;
            }

            if (!project.clientName) {
                project.clientName = "Legacy Client";
                isModified = true;
            }

            const validStatuses = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
            if (!validStatuses.includes(project.status)) {

                project.status = project.status === "Active" ? "In Progress" : "Planning";
                isModified = true;
            }

            if (isModified) {
                await project.save();
                console.log(`Updated legacy schema fields for Project ID: ${project._id}`);
            }

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
