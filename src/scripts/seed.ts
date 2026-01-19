/**
 * Seed script to migrate existing plant data from TypeScript arrays to SQLite database
 */

import { db } from "../db/client.node.ts";
import { plants, plantTags, plantCompanions } from "../db/schema/index.ts";
import { plantsDatabase } from "../data/plants-source.db.ts";

async function seed() {
  console.log("Starting database seed...");
  console.log(`Found ${plantsDatabase.length} plants to import`);

  let successCount = 0;
  let errorCount = 0;

  // PASS 1: Insert all plants and tags (no companions)
  console.log("\n=== Pass 1: Inserting plants and tags ===");
  for (const plant of plantsDatabase) {
    try {
      // Insert main plant record
      await db.insert(plants).values({
        id: plant.id,
        commonName: plant.commonName,
        variety: plant.variety,
        scientificName: plant.scientificName,
        brand: plant.brand,
        soilRichness: plant.soilRichness,
        soilPH: plant.soilPH,
        spacing: plant.spacing,
        plantingMethod: plant.plantingMethod,
        springTiming: plant.springTiming,
        fallTiming: plant.fallTiming,
        seedDepth: plant.seedDepth,
        germinationDays: plant.germinationDays,
        germinationRequirements: plant.germinationRequirements,
        temperature: plant.temperature,
        successionPlanting: plant.successionPlanting,
        frostTolerance: plant.frostTolerance,
        sunRequirement: plant.sunRequirement,
        waterRequirement: plant.waterRequirement,
        growthHabit: plant.growthHabit,
        harvestStages: plant.harvestStages,
        care: plant.care,
        notes: plant.notes,
        metadata: plant.metadata,
      });

      // Insert tags
      if (plant.tags && plant.tags.length > 0) {
        for (const tag of plant.tags) {
          await db.insert(plantTags).values({
            plantId: plant.id,
            tag: tag,
          });
        }
      }

      successCount++;
      console.log(`✓ Imported: ${plant.commonName} - ${plant.variety} (${successCount}/${plantsDatabase.length})`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to import ${plant.commonName} - ${plant.variety}:`, error);
    }
  }

  // PASS 2: Insert all companions (now that all plants exist)
  console.log("\n=== Pass 2: Inserting companion relationships ===");
  let companionCount = 0;
  let companionErrors = 0;

  for (const plant of plantsDatabase) {
    if (plant.companions && plant.companions.length > 0) {
      for (const companion of plant.companions) {
        try {
          await db.insert(plantCompanions).values({
            plantId: plant.id,
            companionPlantId: companion.plantId,
            companionPlantName: companion.plantName,
            relationship: companion.relationship,
            reason: companion.reason,
            distanceNotes: companion.distanceNotes,
          });
          companionCount++;
        } catch (error) {
          companionErrors++;
          console.error(`✗ Failed to add companion for ${plant.commonName}: ${companion.plantName}`, error);
        }
      }
    }
  }

  console.log(`✓ Added ${companionCount} companion relationships (${companionErrors} errors)`);

  console.log("\n=== Seed Summary ===");
  console.log(`Successfully imported: ${successCount} plants`);
  console.log(`Failed imports: ${errorCount} plants`);

  // Verify counts
  const plantCount = await db.select({ count: plants.id }).from(plants);
  const tagCount = await db.select({ count: plantTags.tag }).from(plantTags);
  const companionDbCount = await db.select({ count: plantCompanions.id }).from(plantCompanions);

  console.log("\n=== Database Statistics ===");
  console.log(`Total plants in database: ${plantCount.length}`);
  console.log(`Total plant-tag relationships: ${tagCount.length}`);
  console.log(`Total companion relationships: ${companionDbCount.length}`);

  console.log("\nSeed complete!");
}

// Run the seed function
seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
