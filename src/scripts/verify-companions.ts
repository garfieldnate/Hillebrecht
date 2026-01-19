/**
 * Verify companion plant relationships in database
 */

import { db } from "../db/client.node.ts";
import { plants, plantCompanions } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";

async function verifyCompanions() {
  console.log("=== Companion Relationship Verification ===\n");

  // Get total count
  const allCompanions = await db.select().from(plantCompanions);
  console.log(`Total companion relationships: ${allCompanions.length}\n`);

  // Get all plants
  const allPlants = await db.select({
    id: plants.id,
    commonName: plants.commonName,
    variety: plants.variety
  }).from(plants);

  const plantMap = new Map(allPlants.map(p => [p.id, p]));

  // Count by relationship type
  const beneficial = allCompanions.filter(c => c.relationship === 'beneficial').length;
  const detrimental = allCompanions.filter(c => c.relationship === 'detrimental').length;

  console.log(`Beneficial relationships: ${beneficial}`);
  console.log(`Detrimental relationships: ${detrimental}\n`);

  // Find plants with most companions
  const companionCounts = new Map<string, number>();
  allCompanions.forEach(c => {
    companionCounts.set(c.plantId, (companionCounts.get(c.plantId) || 0) + 1);
  });

  const topPlants = Array.from(companionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log("=== Plants with Most Companions ===");
  topPlants.forEach(([plantId, count]) => {
    const plant = plantMap.get(plantId);
    console.log(`  ${plant?.commonName} - ${plant?.variety}: ${count} companions`);
  });

  // Show detailed companions for top plant
  if (topPlants.length > 0) {
    const [topPlantId] = topPlants[0];
    const topPlant = plantMap.get(topPlantId);
    const companions = allCompanions.filter(c => c.plantId === topPlantId);

    console.log(`\n=== Companions for ${topPlant?.commonName} - ${topPlant?.variety} ===`);
    companions.forEach(c => {
      const companion = plantMap.get(c.companionPlantId);
      const symbol = c.relationship === 'beneficial' ? '✓' : '✗';
      console.log(`  ${symbol} ${companion?.commonName} - ${companion?.variety}`);
      console.log(`     ${c.reason}`);
    });
  }

  console.log("\n=== Verification Complete ===");
}

verifyCompanions().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
