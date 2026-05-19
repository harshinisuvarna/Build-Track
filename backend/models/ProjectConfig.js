const mongoose = require("mongoose");

const projectConfigSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            unique: true // 1-to-1 relationship with the Project
        },

        landArea: {
            value: { type: Number, default: 0 },
            unit: { type: String, enum: ["Sq ft", "Sq mt"], default: "Sq ft" }
        },

        floorsRequired: [{ type: String }], // Array of strings e.g., ["Ground Floor", "First Floor"]

        roomConfig: {
            oneBhk: { type: Number, default: 0 },
            twoBhk: { type: Number, default: 0 },
            threeBhk: { type: Number, default: 0 },
            customRoom: { type: Number, default: 0 }
        },

        bathroomConfig: {
            western: { type: Number, default: 0 },
            indian: { type: Number, default: 0 },
            common: { type: Number, default: 0 },
            attached: { type: Number, default: 0 }
        },

        additionalConfig: {
            balcony: { type: Boolean, default: false },
            carParking: { type: Boolean, default: false },
            lift: { type: Boolean, default: false },
            terraceAccess: { type: Boolean, default: false },
            interiorWork: { type: Boolean, default: false },
            compoundWall: { type: Boolean, default: false },
            parapetWall: { type: Boolean, default: false },
            terraceWaterproofing: { type: Boolean, default: false },
            bathroomWaterproofing: { type: Boolean, default: false },
            wallPuttyWork: { type: Boolean, default: false },
            falseCeiling: { type: Boolean, default: false },
            modularKitchen: { type: Boolean, default: false },
            wardrobeWork: { type: Boolean, default: false },
            sump: { type: Boolean, default: false },
            septicTank: { type: Boolean, default: false },
            rainwaterHarvesting: { type: Boolean, default: false },
            borewell: { type: Boolean, default: false },
            solarProvision: { type: Boolean, default: false },
            generatorProvision: { type: Boolean, default: false },
            cctvProvision: { type: Boolean, default: false },
            intercomProvision: { type: Boolean, default: false },
            landscaping: { type: Boolean, default: false },
            pavingBlocks: { type: Boolean, default: false },
            overheadWaterTank: { type: Boolean, default: false },
            undergroundWaterTank: { type: Boolean, default: false },
            externalStaircase: { type: Boolean, default: false },
            securityRoom: { type: Boolean, default: false },
            terraceTileWork: { type: Boolean, default: false },
            exteriorCladding: { type: Boolean, default: false },
            elevationWork: { type: Boolean, default: false },
            gateInstallation: { type: Boolean, default: false },
            grillWork: { type: Boolean, default: false },
            aluminiumWork: { type: Boolean, default: false },
            glassWork: { type: Boolean, default: false }
        },

        utilityServices: {
            utilityRoomRequired: { type: Boolean, default: false },
            numberOfUtilityRooms: { type: Number, default: 0 },
            utilitySinkRequired: { type: Boolean, default: false },
            washingMachineProvision: { type: Boolean, default: false },
            washingMachinePoint: { type: Boolean, default: false },
            washingMachineDrainPoint: { type: Boolean, default: false },
            washingClothesSlab: { type: Boolean, default: false },
            dryingArea: { type: Boolean, default: false },
            laundrySpace: { type: Boolean, default: false },
            storageUtilityRack: { type: Boolean, default: false }
        },

        gasConnection: {
            gasConnectionRequired: { type: Boolean, default: false },
            lpgCylinderSpace: { type: Boolean, default: false },
            pngGasLineProvision: { type: Boolean, default: false },
            gasPipelineRouting: { type: Boolean, default: false },
            gasLeakDetectorProvision: { type: Boolean, default: false },
            kitchenExhaustProvision: { type: Boolean, default: false }
        },

        kitchenRequirements: {
            modularKitchen: { type: Boolean, default: false },
            chimneyProvision: { type: Boolean, default: false },
            dishwasherProvision: { type: Boolean, default: false },
            refrigeratorSpace: { type: Boolean, default: false },
            microwaveProvision: { type: Boolean, default: false },
            waterPurifierPoint: { type: Boolean, default: false },
            islandCounter: { type: Boolean, default: false },
            breakfastCounter: { type: Boolean, default: false },
            pantryStorage: { type: Boolean, default: false }
        },

        electricalRequirements: {
            acProvision: { type: Boolean, default: false },
            tvPoint: { type: Boolean, default: false },
            internetWifiPoint: { type: Boolean, default: false },
            inverterProvision: { type: Boolean, default: false },
            upsProvision: { type: Boolean, default: false },
            cctvProvision: { type: Boolean, default: false },
            homeAutomationProvision: { type: Boolean, default: false },
            evChargingPoint: { type: Boolean, default: false }
        },

        plumbingRequirements: {
            hotWaterLine: { type: Boolean, default: false },
            solarWaterLine: { type: Boolean, default: false },
            pressurePump: { type: Boolean, default: false },
            waterSoftenerProvision: { type: Boolean, default: false }
        },

        terraceRequirements: {
            openTerrace: { type: Boolean, default: false },
            seatingArea: { type: Boolean, default: false },
            pergola: { type: Boolean, default: false },
            terraceGarden: { type: Boolean, default: false },
            barbecueCounter: { type: Boolean, default: false },
            outdoorWashArea: { type: Boolean, default: false }
        },

        interiorRequirements: {
            tvUnit: { type: Boolean, default: false },
            crockeryUnit: { type: Boolean, default: false },
            shoeRack: { type: Boolean, default: false },
            poojaUnit: { type: Boolean, default: false },
            studyUnit: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ProjectConfig", projectConfigSchema);