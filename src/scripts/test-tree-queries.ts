/**
 * Test script for tree-specific functionality
 * Demonstrates:
 * - Adding tree varieties
 * - Creating tree plantings with rootstock
 * - Adding yearly harvest data
 * - Adding pruning events
 * - Querying trees by rootstock
 * - Finding compatible pollinizers
 *
 * Note: Uses client.node.ts for Node.js compatibility with tsx
 */

import { db } from "../db/client.node.ts";
import { plants, plantTags, plantings } from "../db/schema/index.ts";
import { eq, sql } from "drizzle-orm";
import { Season } from "../types/common.types.ts";
import type { PlannedPlanting } from "../types/planting.types.ts";

async function testTreeQueries() {
  console.log("=== Testing Tree Tracking System ===\n");

  try {
    // Test 1: Get all fruit tree varieties
    console.log("1. Getting all fruit tree varieties...");
    const treeVarieties = await db
      .select()
      .from(plants)
      .where(sql`${plants.pollinationInfo} IS NOT NULL`);

    console.log(`Found ${treeVarieties.length} fruit tree varieties:`);
    for (const variety of treeVarieties) {
      console.log(`  - ${variety.commonName} - ${variety.variety}`);
      console.log(`    Pollination: ${variety.pollinationInfo?.type}`);
      console.log(`    Rootstocks: ${variety.rootstockOptions?.join(", ")}`);
    }
    console.log("");

    // Test 2: Check pollination compatibility
    console.log("2. Checking pollinizers for Honeycrisp apple...");
    const honeycrisp = await db
      .select()
      .from(plants)
      .where(eq(plants.id, "apple-honeycrisp"))
      .limit(1);

    if (honeycrisp.length > 0 && honeycrisp[0].pollinationInfo?.pollinizers) {
      console.log(`Honeycrisp needs pollination from:`);
      for (const pollinizerId of honeycrisp[0].pollinationInfo.pollinizers) {
        const pollinizer = await db
          .select()
          .from(plants)
          .where(eq(plants.id, pollinizerId))
          .limit(1);

        if (pollinizer.length > 0) {
          console.log(`  - ${pollinizer[0].variety} (bloom time: ${pollinizer[0].pollinationInfo?.bloomTime})`);
        }
      }
    }
    console.log("");

    // Test 3: Add a tree planting with rootstock
    console.log("3. Adding a Honeycrisp tree planting...");
    const treePlanting = {
      id: "test-honeycrisp-1",
      plantId: "apple-honeycrisp",
      plantName: "Apple",
      variety: "Honeycrisp",
      year: 2020,
      season: "spring" as const,
      schedule: {
        transplantDate: "2020-04-15",
      },
      location: {
        bed: "orchard-north",
        section: "row-1",
        positionNotes: "Third tree from east fence",
      },
      quantity: {
        planned: 1,
        unit: "plants" as const,
        actualPlanted: 1,
      },
      status: "growing" as const,
      treeDetails: {
        rootstock: {
          name: "M.9",
          type: "dwarf" as const,
          notes: "Dwarf rootstock for easy maintenance and harvest",
        },
        plantingDate: "2020-04-15",
        isEstablished: true,
        firstFruitYear: 2022,
      },
      notes: "First Honeycrisp tree, planted in full sun location",
      metadata: {
        dateCreated: new Date().toISOString(),
      },
    };

    await db.insert(plantings).values(treePlanting);
    console.log(`✓ Added tree planting: ${treePlanting.variety} on ${treePlanting.treeDetails?.rootstock.name} rootstock`);
    console.log("");

    // Test 4: Query trees by rootstock
    console.log("4. Querying trees on M.9 rootstock...");
    const m9Trees = await db
      .select()
      .from(plantings)
      .where(sql`json_extract(${plantings.treeDetails}, '$.rootstock.name') = ${"M.9"}`);

    console.log(`Found ${m9Trees.length} trees on M.9 rootstock:`);
    for (const tree of m9Trees) {
      const t = tree as PlannedPlanting;
      console.log(`  - ${t.variety} planted ${t.treeDetails?.plantingDate}`);
    }
    console.log("");

    // Test 5: Add yearly harvest data
    console.log("5. Adding 2024 harvest data...");
    const existingTree = await db
      .select()
      .from(plantings)
      .where(eq(plantings.id, "test-honeycrisp-1"))
      .limit(1);

    if (existingTree.length > 0) {
      const tree = existingTree[0] as PlannedPlanting;
      const updatedYearlyData = [
        ...(tree.treeDetails?.yearlyData || []),
        {
          year: 2024,
          harvestData: {
            yieldAmount: "45 lbs",
            yieldQuality: "excellent" as const,
            harvestDates: ["2024-09-15", "2024-09-22", "2024-09-29"],
            notes: "Best year yet, perfect ripeness and sweetness",
          },
          treeHealth: "excellent" as const,
        }
      ];

      await db
        .update(plantings)
        .set({
          treeDetails: {
            ...tree.treeDetails!,
            yearlyData: updatedYearlyData
          }
        })
        .where(eq(plantings.id, "test-honeycrisp-1"));

      console.log("✓ Added 2024 harvest data");
    }
    console.log("");

    // Test 6: Add pruning event
    console.log("6. Adding pruning event...");
    const treeForPruning = await db
      .select()
      .from(plantings)
      .where(eq(plantings.id, "test-honeycrisp-1"))
      .limit(1);

    if (treeForPruning.length > 0) {
      const tree = treeForPruning[0] as PlannedPlanting;
      const yearlyData = tree.treeDetails?.yearlyData || [];
      const yearIndex = yearlyData.findIndex(yd => yd.year === 2024);

      if (yearIndex === -1) {
        yearlyData.push({
          year: 2024,
          pruningEvents: [{
            date: "2024-02-20",
            type: "maintenance" as const,
            description: "Removed crossing branches, opened up center for better air circulation",
            notes: "Heavy pruning to improve light penetration and reduce disease pressure",
          }]
        });
      } else {
        const existingEvents = yearlyData[yearIndex].pruningEvents || [];
        yearlyData[yearIndex].pruningEvents = [
          ...existingEvents,
          {
            date: "2024-02-20",
            type: "maintenance" as const,
            description: "Removed crossing branches, opened up center for better air circulation",
            notes: "Heavy pruning to improve light penetration and reduce disease pressure",
          }
        ];
      }

      await db
        .update(plantings)
        .set({
          treeDetails: {
            ...tree.treeDetails!,
            yearlyData
          }
        })
        .where(eq(plantings.id, "test-honeycrisp-1"));

      console.log("✓ Added pruning event for 2024");
    }
    console.log("");

    // Test 7: Get all tree plantings
    console.log("7. Getting all tree plantings...");
    const allTrees = await db
      .select()
      .from(plantings)
      .where(sql`${plantings.treeDetails} IS NOT NULL`);

    console.log(`Found ${allTrees.length} total tree plantings:`);
    for (const tree of allTrees) {
      const t = tree as PlannedPlanting;
      console.log(`\n  ${t.variety}:`);
      console.log(`    Planted: ${t.treeDetails?.plantingDate}`);
      console.log(`    Rootstock: ${t.treeDetails?.rootstock.name} (${t.treeDetails?.rootstock.type})`);
      console.log(`    Established: ${t.treeDetails?.isEstablished ? "Yes" : "No"}`);
      if (t.treeDetails?.firstFruitYear) {
        console.log(`    First fruit: ${t.treeDetails.firstFruitYear}`);
      }
      if (t.treeDetails?.yearlyData && t.treeDetails.yearlyData.length > 0) {
        console.log(`    Years tracked: ${t.treeDetails.yearlyData.map(yd => yd.year).join(", ")}`);
        for (const yearData of t.treeDetails.yearlyData) {
          if (yearData.harvestData) {
            console.log(`      ${yearData.year}: ${yearData.harvestData.yieldAmount} (${yearData.harvestData.yieldQuality})`);
          }
          if (yearData.pruningEvents && yearData.pruningEvents.length > 0) {
            console.log(`      ${yearData.year}: ${yearData.pruningEvents.length} pruning event(s)`);
          }
        }
      }
    }
    console.log("");

    console.log("=== All Tests Completed Successfully! ===");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testTreeQueries().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
