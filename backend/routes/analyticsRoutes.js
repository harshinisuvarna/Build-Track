const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Project = require("../models/Project");
const ExpenseEntry = require("../models/ExpenseEntry");
const { protect, canAccessProjectFilter } = require("../middleware/auth");

router.get("/:projectId", protect, async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Fetch the Project to get the Budgets
        const project = await Project.findOne(canAccessProjectFilter(req, projectId)).lean();

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // 2. Run the Aggregation Pipeline to sum up all expenses by Entry Type
        const expenseAggregation = await ExpenseEntry.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(projectId) } },
            {
                $group: {
                    _id: "$entryType",
                    totalSpent: { $sum: "$totalAmount" }
                }
            }
        ]);

        // 3. Format the Actuals (defaulting to 0 if no expenses exist yet)
        const actuals = {
            Material: 0,
            Labour: 0,
            Equipment: 0,
            Misc: 0,
            Total: 0
        };

        expenseAggregation.forEach(item => {
            if (actuals[item._id] !== undefined) {
                actuals[item._id] = item.totalSpent;
                actuals.Total += item.totalSpent;
            }
        });

        // 4. Calculate Variances (Budget minus Actuals)
        // Positive variance means under budget, Negative means over budget
        const variance = {
            Material: project.budget.material - actuals.Material,
            Labour: project.budget.labour - actuals.Labour,
            Equipment: project.budget.equipment - actuals.Equipment,
            Misc: project.budget.misc - actuals.Misc,
            Total: project.budget.total - actuals.Total
        };

        // 5. Calculate Burn Rate (Percentage of budget spent)
        const burnRatePercentage = project.budget.total > 0
            ? ((actuals.Total / project.budget.total) * 100).toFixed(2)
            : 0;

        // Send the beautiful, pre-calculated payload to the Flutter frontend
        res.json({
            projectCode: project.projectCode,
            projectName: project.clientName, // Assuming client name acts as project title here
            budget: project.budget,
            actuals,
            variance,
            burnRatePercentage: Number(burnRatePercentage)
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Failed to generate analytics report" });
    }
});

module.exports = router;