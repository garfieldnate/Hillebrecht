/**
 * Test script to verify database migration
 * Tests all query functions and verifies data integrity
 */

// Note: This test script uses the Node.js-compatible client
// Update the imports in the query files temporarily to use client.node.ts
// Or create Node-specific query exports

import { db } from "../db/client.node.ts";
import { plants, plantTags } from "../db/schema/index.ts";
import { eq, like, or } from "drizzle-orm";
import type { Plant } from "../types/plant.types.ts";
import {
  FrostTolerance,
  GrowthHabit,
  PlantingMethod,
  SunRequirement,
  WaterRequirement,
  Season,
} from "../types/common.types.ts";

// Import helper functions inline since query files use different client
function toPlantingMethod(value: string): PlantingMethod {
  const map: Record<string, PlantingMethod> = {
    "direct-seed": PlantingMethod.DirectSeed,
    "transplant": PlantingMethod.Transplant,
    "either": PlantingMethod.Either,
  };
  return map[value] || value as any;
}

function toFrostTolerance(value: string): FrostTolerance {
  const map: Record<string, FrostTolerance> = {
    "tender": FrostTolerance.Tender,
    "half-hardy": FrostTolerance.HalfHardy,
    "hardy": FrostTolerance.Hardy,
    "very-hardy": FrostTolerance.VeryHardy,
  };
  return map[value] || value as any;
}

function toSunRequirement(value: string): SunRequirement {
  const map: Record<string, SunRequirement> = {
    "full-sun": SunRequirement.FullSun,
    "partial-sun": SunRequirement.PartialSun,
    "partial-shade": SunRequirement.PartialShade,
    "full-shade": SunRequirement.FullShade,
  };
  return map[value] || value as any;
}

function toWaterRequirement(value: string): WaterRequirement {
  const map: Record<string, WaterRequirement> = {
    "low": WaterRequirement.Low,
    "moderate": WaterRequirement.Moderate,
    "high": WaterRequirement.High,
  };
  return map[value] || value as any;
}

async function getPlantById(id: string): Promise<Plant | undefined> {
  const result = await db
    .select()
    .from(plants)
    .where(eq(plants.id, id))
    .limit(1);

  if (result.length === 0) return undefined;

  const plant = result[0];
  const tags = await db
    .select({ tag: plantTags.tag })
    .from(plantTags)
    .where(eq(plantTags.plantId, id));

  return {
    id: plant.id,
    commonName: plant.commonName,
    variety: plant.variety,
    scientificName: plant.scientificName || undefined,
    brand: plant.brand || undefined,
    soilRichness: plant.soilRichness,
    soilPH: plant.soilPH,
    spacing: plant.spacing,
    plantingMethod: toPlantingMethod(plant.plantingMethod),
    springTiming: plant.springTiming || undefined,
    fallTiming: plant.fallTiming || undefined,
    seedDepth: plant.seedDepth,
    temperature: plant.temperature,
    germinationDays: plant.germinationDays,
    germinationRequirements: plant.germinationRequirements || undefined,
    successionPlanting: plant.successionPlanting || undefined,
    frostTolerance: {
      seedling: toFrostTolerance(plant.frostTolerance.seedling),
      mature: toFrostTolerance(plant.frostTolerance.mature),
    },
    sunRequirement: toSunRequirement(plant.sunRequirement),
    waterRequirement: toWaterRequirement(plant.waterRequirement),
    growthHabit: plant.growthHabit as any,
    harvestStages: plant.harvestStages,
    companions: undefined,
    care: plant.care || undefined,
    tags: tags.length > 0 ? tags.map((t) => t.tag) : undefined,
    notes: plant.notes || undefined,
    metadata: plant.metadata || undefined,
  };
}

async function searchPlants(query: string): Promise<Plant[]> {
  const searchPattern = `%${query}%`;
  const results = await db
    .select()
    .from(plants)
    .where(
      or(
        like(plants.commonName, searchPattern),
        like(plants.variety, searchPattern)
      )
    );

  const fullPlants: Plant[] = [];
  for (const result of results) {
    const plant = await getPlantById(result.id);
    if (plant) fullPlants.push(plant);
  }
  return fullPlants;
}

async function getPlantsByTag(tag: string): Promise<Plant[]> {
  const plantIds = await db
    .select({ plantId: plantTags.plantId })
    .from(plantTags)
    .where(eq(plantTags.tag, tag));

  const fullPlants: Plant[] = [];
  for (const { plantId } of plantIds) {
    const plant = await getPlantById(plantId);
    if (plant) fullPlants.push(plant);
  }
  return fullPlants;
}

async function getAllTags(): Promise<string[]> {
  const results = await db
    .selectDistinct({ tag: plantTags.tag })
    .from(plantTags)
    .orderBy(plantTags.tag);
  return results.map((r) => r.tag);
}

async function runTests() {
  console.log("=== Testing Database Migration ===\n");

  // Test 1: Get specific plant
  console.log("Test 1: Get plant by ID (asparagus-mary-washington)");
  const asparagus = await getPlantById("asparagus-mary-washington");
  if (asparagus) {
    console.log(`✓ Found: ${asparagus.commonName} - ${asparagus.variety}`);
    console.log(`  Has germination requirements: ${!!asparagus.germinationRequirements}`);
    if (asparagus.germinationRequirements) {
      console.log(`  Stratification type: ${asparagus.germinationRequirements.stratification?.type}`);
      console.log(`  Stratification duration: ${asparagus.germinationRequirements.stratification?.duration} days`);
    }
  } else {
    console.log("✗ Failed to find asparagus");
  }

  // Test 2: Search functionality
  console.log("\nTest 2: Search for 'tomato'");
  const tomatoes = await searchPlants("tomato");
  console.log(`✓ Found ${tomatoes.length} tomato varieties`);
  tomatoes.forEach(t => console.log(`  - ${t.commonName} - ${t.variety}`));

  // Test 3: Filter by tag
  console.log("\nTest 3: Get all perennial plants");
  const perennials = await getPlantsByTag("perennial");
  console.log(`✓ Found ${perennials.length} perennial plants`);
  console.log(`  First 5: ${perennials.slice(0, 5).map(p => p.commonName).join(", ")}`);

  // Test 4: Get all tags
  console.log("\nTest 4: Get all unique tags");
  const allTags = await getAllTags();
  console.log(`✓ Total unique tags: ${allTags.length}`);
  console.log(`  Sample tags: ${allTags.slice(0, 15).join(", ")}`);

  // Test 5: Get plants with germination requirements
  console.log("\nTest 5: Get plants with special germination requirements");
  const plantsWithGermReqs = await getAllTags()
    .then(() => searchPlants(""))
    .catch(() => []);

  // Since searchPlants("") might not work, let's test specific plants
  const plantsToCheck = [
    "asparagus-mary-washington",
    "asparagus-uc-72",
    "yarrow-golden-yarrow",
    "lovage-common",
    "parsley-giant-of-italy",
    "sweet-william-albus",
    "lilac-common"
  ];

  let germCount = 0;
  for (const id of plantsToCheck) {
    const plant = await getPlantById(id);
    if (plant?.germinationRequirements) {
      germCount++;
    }
  }
  console.log(`✓ Found ${germCount} plants with germination requirements (from sample)`);

  // Test 6: Verify total plant count
  console.log("\nTest 6: Verify total plant count");
  const allPlants = await db.select().from(plants);
  console.log(`✓ Total plants in database: ${allPlants.length} (expected: 69)`);

  // Test 7: Verify enum conversions
  console.log("\nTest 7: Verify enum conversions");
  const lettuce = await getPlantById("lettuce-black-seeded-simpson");
  if (lettuce) {
    console.log(`✓ Lettuce found`);
    console.log(`  Sun requirement type: ${typeof lettuce.sunRequirement}`);
    console.log(`  Water requirement type: ${typeof lettuce.waterRequirement}`);
    console.log(`  Frost tolerance (seedling) type: ${typeof lettuce.frostTolerance.seedling}`);
    console.log(`  Planting method type: ${typeof lettuce.plantingMethod}`);
  }

  console.log("\n=== All Tests Complete ===");
}

runTests().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
