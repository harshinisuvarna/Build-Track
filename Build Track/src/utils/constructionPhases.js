let _counter = 0;
const uid = () => `cp_${Date.now()}_${++_counter}`;

export function buildDefaultPhases() {
  return [
    {
      id: uid(), phaseName: "Pre-Construction", isCustom: false,
      activities: [
        { id: uid(), name: "Site Survey & Soil Testing", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Architectural Drawings", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Structural Design", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Approvals & Permits", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
    {
      id: uid(), phaseName: "Site Preparation", isCustom: false,
      activities: [
        { id: uid(), name: "Demolition & Clearing", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Tree Removal", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Temporary Facilities", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Boundary Wall & Fencing", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
    {
      id: uid(), phaseName: "Foundation & Plinth Work", isCustom: false,
      activities: [
        { id: uid(), name: "Excavation", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "PCC (Plain Cement Concrete)", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Footing Rebar", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Footing Concrete", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Plinth Beam", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Backfilling", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
    {
      id: uid(), phaseName: "Floor Construction", isCustom: false,
      activities: [
        { id: uid(), name: "Column Rebar", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Column Shuttering", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Column Concrete", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Beam Bottom & Side Shuttering", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Beam & Slab Rebar", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Beam & Slab Concrete", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Curing", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
    {
      id: uid(), phaseName: "Finishing Work", isCustom: false,
      activities: [
        { id: uid(), name: "Brickwork / Blockwork", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Plastering", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Painting", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Flooring", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Carpentry", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Fixtures & Fittings", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
    {
      id: uid(), phaseName: "External Works", isCustom: false,
      activities: [
        { id: uid(), name: "Compound Wall", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Gate Installation", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Landscaping", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Driveway & Paving", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Drainage", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
    {
      id: uid(), phaseName: "MEP (Mechanical, Electrical, Plumbing)", isCustom: false,
      activities: [
        { id: uid(), name: "Electrical Conduit & Wiring", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Plumbing Rough-in", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "HVAC Ducting", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
        { id: uid(), name: "Fire Safety Systems", isCustom: false, completed: false, budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0 },
      ],
    },
  ];
}

export function addCustomPhase(phases, phaseName) {
  return [...phases, {
    id: uid(), phaseName, isCustom: true, activities: [],
  }];
}

export function addActivityToPhase(phases, phaseId, activityName) {
  return phases.map(p => {
    if (p.id !== phaseId) return p;
    return {
      ...p,
      activities: [...p.activities, {
        id: uid(), name: activityName, isCustom: true, completed: false,
        budgetMaterial: 0, budgetLabour: 0, budgetEquipment: 0,
      }],
    };
  });
}

export function toggleActivity(phases, phaseId, activityId) {
  return phases.map(p => {
    if (p.id !== phaseId) return p;
    return {
      ...p,
      activities: p.activities.map(a =>
        a.id === activityId ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : null } : a
      ),
    };
  });
}

export function calcProgress(phases) {
  let total = 0;
  let completed = 0;
  phases.forEach(p => {
    p.activities.forEach(a => {
      total++;
      if (a.completed) completed++;
    });
  });
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function getPhaseProgress(phase) {
  const total = phase.activities.length;
  if (total === 0) return 0;
  const completed = phase.activities.filter(a => a.completed).length;
  return Math.round((completed / total) * 100);
}

export const BUILDING_TYPES = [
  { main: "Residential", subs: ["Individual House", "Apartment / Flat", "Villa", "Row House", "Duplex", "Studio Apartment"] },
  { main: "Commercial", subs: ["Office Building", "Retail Store", "Shopping Mall", "Warehouse", "Hotel", "Restaurant"] },
  { main: "Industrial", subs: ["Factory", "Workshop", "Godown / Storage", "Plant Unit"] },
  { main: "Institutional", subs: ["School", "College", "Hospital", "Temple / Religious", "Community Hall"] },
  { main: "Educational", subs: ["Primary School", "High School", "College Building", "Training Center", "Library"] },
];

export const FLOOR_OPTIONS = [
  "Ground Floor", "First Floor", "Second Floor", "Third Floor",
  "Fourth Floor", "Fifth Floor", "Basement",
];

export const FEATURE_OPTIONS = [
  "Balcony", "Car Parking", "Lift", "Terrace Access", "Interior Work",
  "Compound Wall", "Parapet Wall", "Terrace Waterproofing", "Bathroom Waterproofing",
  "Wall Putty Work", "False Ceiling", "Modular Kitchen", "Wardrobe Work",
  "Sump", "Septic Tank", "Rainwater Harvesting", "Borewell",
  "Solar Provision", "Generator Provision", "CCTV Provision", "Intercom Provision",
  "Landscaping", "Paving Blocks", "Overhead Water Tank", "Underground Water Tank",
  "External Staircase", "Security Room", "Terrace Tile Work", "Exterior Cladding",
  "Elevation Work", "Gate Installation", "Grill Work", "Aluminium Work", "Glass Work",
];
