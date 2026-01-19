/**
 * Smart companion plant relationship fixer
 * Maps generic companion IDs to actual plants in the database
 */

import { db } from "../db/client.node.ts";
import { plants, plantCompanions } from "../db/schema/index.ts";
import { plantsDatabase } from "../data/plants-source.db.ts";
import { eq, like } from "drizzle-orm";

async function fixCompanionsSmart() {
  console.log("=== Smart Companion Relationship Fixer ===\n");

  // Get all plants from database
  const dbPlants = await db.select({
    id: plants.id,
    commonName: plants.commonName,
    variety: plants.variety
  }).from(plants);

  console.log(`Total plants in database: ${dbPlants.length}`);

  // Build lookup maps
  const plantById = new Map(dbPlants.map(p => [p.id, p]));
  const plantsByCommonName = new Map<string, typeof dbPlants>();

  dbPlants.forEach(plant => {
    const name = plant.commonName.toLowerCase();
    if (!plantsByCommonName.has(name)) {
      plantsByCommonName.set(name, []);
    }
    plantsByCommonName.get(name)!.push(plant);
  });

  /**
   * Try to find matching plants for a companion ID
   */
  function findMatchingPlants(companionId: string, companionName: string): string[] {
    // Direct ID match
    if (plantById.has(companionId)) {
      return [companionId];
    }

    // Extract common name from generic ID (e.g., "tomato-generic" -> "tomato")
    const genericMatch = companionId.match(/^(.+)-generic$/);
    if (genericMatch) {
      const baseName = genericMatch[1].toLowerCase();
      const matches = plantsByCommonName.get(baseName);
      if (matches && matches.length > 0) {
        return matches.map(p => p.id);
      }
    }

    // Try matching by companion name
    const nameLower = companionName.toLowerCase();
    const nameMatches = plantsByCommonName.get(nameLower);
    if (nameMatches && nameMatches.length > 0) {
      return nameMatches.map(p => p.id);
    }

    // Handle specific non-generic IDs that might partially match
    // e.g., "basil-genovese" -> find any basil
    const firstPart = companionId.split('-')[0].toLowerCase();
    const partialMatches = plantsByCommonName.get(firstPart);
    if (partialMatches && partialMatches.length > 0) {
      return partialMatches.map(p => p.id);
    }

    return [];
  }

  // Clear existing companions
  await db.delete(plantCompanions);
  console.log("Cleared existing companion relationships\n");

  let totalCompanions = 0;
  let insertedRelationships = 0;
  let skippedNoMatch = 0;
  const matchStats = new Map<string, number>();

  // Process each plant's companions
  for (const plant of plantsDatabase) {
    if (!plant.companions || plant.companions.length === 0) continue;

    for (const companion of plant.companions) {
      totalCompanions++;

      const matchingPlantIds = findMatchingPlants(companion.plantId, companion.plantName);

      if (matchingPlantIds.length === 0) {
        skippedNoMatch++;
        console.log(`⚠ No match for: ${companion.plantId} (${companion.plantName}) referenced by ${plant.commonName}`);
        continue;
      }

      // Insert relationship for each matching plant
      for (const matchedId of matchingPlantIds) {
        try {
          await db.insert(plantCompanions).values({
            plantId: plant.id,
            companionPlantId: matchedId,
            companionPlantName: companion.plantName,
            relationship: companion.relationship,
            reason: companion.reason,
            distanceNotes: companion.distanceNotes,
          });
          insertedRelationships++;

          // Track mapping stats
          if (matchingPlantIds.length > 1) {
            const key = `${companion.plantId} -> ${matchingPlantIds.length} plants`;
            matchStats.set(key, (matchStats.get(key) || 0) + 1);
          }
        } catch (error) {
          console.error(`✗ Failed to insert companion: ${plant.commonName} + ${companion.plantName}`);
        }
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total companion references in source: ${totalCompanions}`);
  console.log(`Relationships inserted: ${insertedRelationships}`);
  console.log(`Skipped (no match): ${skippedNoMatch}`);

  if (matchStats.size > 0) {
    console.log("\n=== Multi-Plant Mappings ===");
    console.log("Generic IDs mapped to multiple specific plants:");
    Array.from(matchStats.entries()).forEach(([mapping, count]) => {
      console.log(`  ${mapping} (${count} references)`);
    });
  }

  // Verify final count
  const finalCount = await db.select().from(plantCompanions);
  console.log(`\n✓ Total companion relationships in database: ${finalCount.length}`);

  // Show sample relationships
  console.log("\n=== Sample Relationships ===");
  const samples = finalCount.slice(0, 10);
  for (const rel of samples) {
    const fromPlant = plantById.get(rel.plantId);
    const toPlant = plantById.get(rel.companionPlantId);
    console.log(`  ${fromPlant?.commonName} ${rel.relationship === 'beneficial' ? '✓' : '✗'} ${toPlant?.commonName} - ${toPlant?.variety}`);
  }
}

fixCompanionsSmart().catch((error) => {
  console.error("Failed to fix companions:", error);
  process.exit(1);
});
