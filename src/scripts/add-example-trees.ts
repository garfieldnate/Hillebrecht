/**
 * Script to add example fruit tree varieties to the database
 * Demonstrates tree-specific fields: pollinationInfo and rootstockOptions
 */

import { db } from "../db/client.node.ts";
import { plants, plantTags } from "../db/schema/index.ts";
import {
  PlantingMethod,
  FrostTolerance,
  SunRequirement,
  WaterRequirement,
  SoilRichness,
} from "../types/common.types.ts";

// Example fruit tree varieties with pollination info and rootstock options
const exampleTrees = [
  {
    id: "apple-honeycrisp",
    commonName: "Apple",
    variety: "Honeycrisp",
    scientificName: "Malus domestica",
    soilRichness: [SoilRichness.Moderate, SoilRichness.Rich],
    soilPH: { min: 6.0, max: 7.0, ideal: 6.5 },
    spacing: {
      betweenPlants: 96, // 8 feet for dwarf, adjust for rootstock
      betweenRows: 120, // 10 feet
      squareFootDensity: 0,
    },
    plantingMethod: PlantingMethod.Transplant,
    seedDepth: 0, // Not grown from seed typically
    germinationDays: 0,
    temperature: {
      soilTempMin: 50,
      soilTempIdeal: 60,
    },
    frostTolerance: {
      seedling: FrostTolerance.Hardy,
      mature: FrostTolerance.VeryHardy,
    },
    sunRequirement: SunRequirement.FullSun,
    waterRequirement: WaterRequirement.Moderate,
    harvestStages: [
      {
        stage: "mature",
        daysFromPlanting: 1095, // ~3 years
        description: "Full production typically begins 3-5 years after planting",
        harvestTips: "Harvest when fruit is crisp and sweet, typically late September",
      },
    ],
    pollinationInfo: {
      type: "self-sterile" as const,
      pollinizers: ["apple-gala", "apple-fuji", "apple-granny-smith"],
      bloomTime: "mid" as const,
      chillHours: { min: 800, max: 1000 },
      zones: "3-8",
    },
    rootstockOptions: ["M.9", "M.26", "M.111", "Bud 118", "Standard"],
    care: {
      fertilizing: "Apply balanced fertilizer in early spring",
      pruning: "Prune in late winter when dormant; formative pruning first 3 years",
      support: "Stake young trees; dwarf rootstocks need permanent support",
      commonPests: ["Codling moth", "Apple maggot", "Aphids"],
      commonDiseases: ["Apple scab", "Fire blight", "Powdery mildew"],
      preventionTips: "Good air circulation, dormant oil spray, disease-resistant varieties",
    },
    notes: "Excellent storage apple, crisp and sweet. Requires cross-pollination.",
    tags: ["perennial", "food", "tree", "fruit", "zones-3-8", "self-sterile"],
    metadata: {
      dateAdded: new Date().toISOString(),
      source: "Example data",
    },
  },
  {
    id: "apple-gala",
    commonName: "Apple",
    variety: "Gala",
    scientificName: "Malus domestica",
    soilRichness: [SoilRichness.Moderate, SoilRichness.Rich],
    soilPH: { min: 6.0, max: 7.0, ideal: 6.5 },
    spacing: {
      betweenPlants: 96,
      betweenRows: 120,
      squareFootDensity: 0,
    },
    plantingMethod: PlantingMethod.Transplant,
    seedDepth: 0,
    germinationDays: 0,
    temperature: {
      soilTempMin: 50,
      soilTempIdeal: 60,
    },
    frostTolerance: {
      seedling: FrostTolerance.Hardy,
      mature: FrostTolerance.VeryHardy,
    },
    sunRequirement: SunRequirement.FullSun,
    waterRequirement: WaterRequirement.Moderate,
    harvestStages: [
      {
        stage: "mature",
        daysFromPlanting: 1095,
        description: "Bears fruit 2-4 years after planting",
        harvestTips: "Harvest in early to mid-September when crisp and sweet",
      },
    ],
    pollinationInfo: {
      type: "self-sterile" as const,
      pollinizers: ["apple-honeycrisp", "apple-fuji", "apple-granny-smith"],
      bloomTime: "early" as const,
      chillHours: { min: 400, max: 600 },
      zones: "4-9",
    },
    rootstockOptions: ["M.9", "M.26", "M.111", "EMLA 7", "Standard"],
    care: {
      fertilizing: "Fertilize in early spring with balanced fertilizer",
      pruning: "Annual pruning in late winter; thin fruit for larger apples",
      support: "Stake dwarf trees",
      commonPests: ["Codling moth", "Apple maggot"],
      commonDiseases: ["Apple scab", "Fire blight"],
      preventionTips: "Choose disease-resistant rootstocks, maintain good air flow",
    },
    notes: "Popular early-season apple. Excellent fresh eating. Good pollinator.",
    tags: ["perennial", "food", "tree", "fruit", "zones-4-9", "self-sterile"],
    metadata: {
      dateAdded: new Date().toISOString(),
      source: "Example data",
    },
  },
  {
    id: "pear-bartlett",
    commonName: "Pear",
    variety: "Bartlett",
    scientificName: "Pyrus communis",
    soilRichness: [SoilRichness.Moderate, SoilRichness.Rich],
    soilPH: { min: 6.0, max: 7.0, ideal: 6.5 },
    spacing: {
      betweenPlants: 120, // 10 feet
      betweenRows: 180, // 15 feet
      squareFootDensity: 0,
    },
    plantingMethod: PlantingMethod.Transplant,
    seedDepth: 0,
    germinationDays: 0,
    temperature: {
      soilTempMin: 50,
      soilTempIdeal: 60,
    },
    frostTolerance: {
      seedling: FrostTolerance.Hardy,
      mature: FrostTolerance.VeryHardy,
    },
    sunRequirement: SunRequirement.FullSun,
    waterRequirement: WaterRequirement.Moderate,
    harvestStages: [
      {
        stage: "mature",
        daysFromPlanting: 1460, // ~4 years
        description: "Bears fruit 4-6 years after planting",
        harvestTips: "Pick when still firm, ripen off tree for best flavor",
      },
    ],
    pollinationInfo: {
      type: "self-sterile" as const,
      pollinizers: ["pear-bosc", "pear-anjou"],
      bloomTime: "mid" as const,
      chillHours: { min: 600, max: 900 },
      zones: "5-8",
    },
    rootstockOptions: ["OHxF 87", "OHxF 97", "Quince A", "Standard"],
    care: {
      fertilizing: "Apply nitrogen fertilizer in early spring",
      pruning: "Prune to central leader shape in late winter",
      support: "Train young trees to strong scaffold branches",
      commonPests: ["Pear psylla", "Codling moth", "Pear slug"],
      commonDiseases: ["Fire blight", "Pear scab"],
      preventionTips: "Resistant to fire blight compared to other varieties",
    },
    notes: "Classic pear, excellent for fresh eating and canning. Very productive.",
    tags: ["perennial", "food", "tree", "fruit", "zones-5-8", "self-sterile"],
    metadata: {
      dateAdded: new Date().toISOString(),
      source: "Example data",
    },
  },
  {
    id: "cherry-montmorency",
    commonName: "Cherry",
    variety: "Montmorency",
    scientificName: "Prunus cerasus",
    soilRichness: [SoilRichness.Moderate],
    soilPH: { min: 6.0, max: 7.5, ideal: 6.5 },
    spacing: {
      betweenPlants: 144, // 12 feet
      betweenRows: 180, // 15 feet
      squareFootDensity: 0,
    },
    plantingMethod: PlantingMethod.Transplant,
    seedDepth: 0,
    germinationDays: 0,
    temperature: {
      soilTempMin: 50,
      soilTempIdeal: 65,
    },
    frostTolerance: {
      seedling: FrostTolerance.Hardy,
      mature: FrostTolerance.VeryHardy,
    },
    sunRequirement: SunRequirement.FullSun,
    waterRequirement: WaterRequirement.Moderate,
    harvestStages: [
      {
        stage: "mature",
        daysFromPlanting: 1095, // ~3 years
        description: "Bears fruit 3-4 years after planting",
        harvestTips: "Harvest when deep red, typically early July",
      },
    ],
    pollinationInfo: {
      type: "self-fertile" as const,
      bloomTime: "mid" as const,
      chillHours: { min: 700, max: 1000 },
      zones: "4-7",
    },
    rootstockOptions: ["Gisela 5", "Gisela 6", "Mahaleb", "Standard"],
    care: {
      fertilizing: "Light fertilization in early spring",
      pruning: "Minimal pruning needed; prune in summer to reduce disease",
      support: "Bird netting essential for harvest protection",
      commonPests: ["Cherry fruit fly", "Birds"],
      commonDiseases: ["Brown rot", "Leaf spot"],
      preventionTips: "Sour cherry, more disease-resistant than sweet cherries",
    },
    notes: "Tart cherry, excellent for pies and preserves. Self-fertile!",
    tags: ["perennial", "food", "tree", "fruit", "zones-4-7", "self-fertile"],
    metadata: {
      dateAdded: new Date().toISOString(),
      source: "Example data",
    },
  },
];

async function addExampleTrees() {
  console.log("Starting example tree import...");
  console.log(`Adding ${exampleTrees.length} fruit tree varieties\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const tree of exampleTrees) {
    try {
      // Extract tags before inserting
      const tags = tree.tags;

      // Insert plant without tags field
      const { tags: _omitTags, ...plantData } = tree;

      await db.insert(plants).values(plantData);

      // Insert tags separately
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await db.insert(plantTags).values({
            plantId: tree.id,
            tag: tag,
          });
        }
      }

      successCount++;
      console.log(`✓ Added: ${tree.commonName} - ${tree.variety}`);
      console.log(`  Pollination: ${tree.pollinationInfo?.type}`);
      console.log(`  Rootstocks: ${tree.rootstockOptions?.join(", ")}`);
      console.log(`  Zones: ${tree.pollinationInfo?.zones}`);
      console.log("");
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to add ${tree.commonName} - ${tree.variety}:`, error);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Successfully added: ${successCount} varieties`);
  console.log(`Failed: ${errorCount} varieties`);

  console.log("\nExample trees ready! You can now:");
  console.log("1. Add tree plantings using these varieties");
  console.log("2. Track rootstock, pollination, and multi-year data");
  console.log("3. Use getTreePlantings() to query all trees");
}

// Run the script
addExampleTrees().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
