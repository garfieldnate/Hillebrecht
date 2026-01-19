/**
 * Script to fix companion plant relationships
 * Analyzes companion references and either matches them to real plants or removes invalid ones
 */

import { db } from "../db/client.node.ts";
import { plants, plantCompanions } from "../db/schema/index.ts";
import { plantsDatabase } from "../data/plants-source.db.ts";
import { eq } from "drizzle-orm";

async function fixCompanions() {
  console.log("=== Fixing Companion Plant Relationships ===\n");

  // Get all plant IDs currently in database
  const dbPlants = await db.select({ id: plants.id, commonName: plants.commonName }).from(plants);
  const validPlantIds = new Set(dbPlants.map(p => p.id));

  console.log(`Total plants in database: ${validPlantIds.size}`);

  // Clear existing companions
  await db.delete(plantCompanions);
  console.log("Cleared existing companion relationships");

  let totalCompanions = 0;
  let validCompanions = 0;
  let invalidCompanions = 0;
  const invalidIds = new Map<string, number>();

  // Process each plant's companions
  for (const plant of plantsDatabase) {
    if (!plant.companions || plant.companions.length === 0) continue;

    for (const companion of plant.companions) {
      totalCompanions++;

      // Check if companion plant ID exists in database
      if (validPlantIds.has(companion.plantId)) {
        // Valid companion - insert it
        try {
          await db.insert(plantCompanions).values({
            plantId: plant.id,
            companionPlantId: companion.plantId,
            companionPlantName: companion.plantName,
            relationship: companion.relationship,
            reason: companion.reason,
            distanceNotes: companion.distanceNotes,
          });
          validCompanions++;
        } catch (error) {
          console.error(`Failed to insert companion for ${plant.commonName}: ${companion.plantName}`);
        }
      } else {
        // Invalid companion - track it
        invalidCompanions++;
        const count = invalidIds.get(companion.plantId) || 0;
        invalidIds.set(companion.plantId, count + 1);
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total companion relationships in source: ${totalCompanions}`);
  console.log(`Valid relationships inserted: ${validCompanions}`);
  console.log(`Invalid relationships skipped: ${invalidCompanions}`);

  if (invalidIds.size > 0) {
    console.log("\n=== Invalid Companion IDs ===");
    console.log("These are placeholder/generic IDs that don't match actual plants:");
    const sorted = Array.from(invalidIds.entries()).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([id, count]) => {
      console.log(`  ${id} (referenced ${count} times)`);
    });

    console.log("\nNote: These generic companions (like 'brassicas', 'alliums') represent");
    console.log("plant families/groups rather than specific varieties. You may want to");
    console.log("update them to reference specific plants in your database.");
  }

  // Verify final count
  const finalCount = await db.select({ count: plantCompanions.id }).from(plantCompanions);
  console.log(`\n✓ Total companion relationships in database: ${finalCount.length}`);
}

fixCompanions().catch((error) => {
  console.error("Failed to fix companions:", error);
  process.exit(1);
});
