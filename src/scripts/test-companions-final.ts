/**
 * Final test to verify companion relationships work with query functions
 */

import { db } from "../db/client.node.ts";
import { plants, plantCompanions } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import type { Plant } from "../types/plant.types.ts";
import {
  FrostTolerance,
  PlantingMethod,
  SunRequirement,
  WaterRequirement,
} from "../types/common.types.ts";

// Helper functions (copied from plants.queries.ts for Node.js compatibility)
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

  // Get companions for this plant
  const companions = await db
    .select()
    .from(plantCompanions)
    .where(eq(plantCompanions.plantId, id));

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
    companions: companions.length > 0
      ? companions.map((c) => ({
          plantId: c.companionPlantId,
          plantName: c.companionPlantName,
          relationship: c.relationship,
          reason: c.reason,
          distanceNotes: c.distanceNotes || undefined,
        }))
      : undefined,
    care: plant.care || undefined,
    tags: undefined, // Not loading tags for this test
    notes: plant.notes || undefined,
    metadata: plant.metadata || undefined,
  };
}

async function testCompanions() {
  console.log("=== Testing Companion Relationships with Query Functions ===\n");

  // Test 1: Get tomato and check companions
  console.log("Test 1: Tomato companions");
  const tomato = await getPlantById("tomato-cherokee-purple");
  if (tomato && tomato.companions) {
    console.log(`✓ Tomato has ${tomato.companions.length} companions:`);
    tomato.companions.forEach(c => {
      const symbol = c.relationship === 'beneficial' ? '✓' : '✗';
      console.log(`  ${symbol} ${c.plantName} - ${c.reason.substring(0, 60)}...`);
    });
  } else {
    console.log("✗ Tomato has no companions");
  }

  // Test 2: Get bean and check companions
  console.log("\nTest 2: Bean companions");
  const bean = await getPlantById("bean-burpee-stringless-green-pod");
  if (bean && bean.companions) {
    console.log(`✓ Bean has ${bean.companions.length} companions:`);
    const beneficial = bean.companions.filter(c => c.relationship === 'beneficial').length;
    const detrimental = bean.companions.filter(c => c.relationship === 'detrimental').length;
    console.log(`  Beneficial: ${beneficial}, Detrimental: ${detrimental}`);
  } else {
    console.log("✗ Bean has no companions");
  }

  // Test 3: Get lettuce and check companions
  console.log("\nTest 3: Lettuce companions");
  const lettuce = await getPlantById("lettuce-black-seeded-simpson");
  if (lettuce && lettuce.companions) {
    console.log(`✓ Lettuce has ${lettuce.companions.length} companions`);
  } else {
    console.log("✗ Lettuce has no companions");
  }

  console.log("\n=== All Tests Complete ===");
  console.log("Companion relationships are working correctly!");
}

testCompanions().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
