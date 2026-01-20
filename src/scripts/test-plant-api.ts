/**
 * Test the simplified plant API
 * Demonstrates how easy it is to add plants
 */

import { addPlantSimple } from "../api/plants.api.ts";

async function main() {
  console.log("🧪 Testing Simplified Plant API\n");

  // Test 1: Minimal data
  console.log("Test 1: Adding plant with minimal data...");
  try {
    const id1 = await addPlantSimple({
      commonName: "Radish",
      variety: "Cherry Belle",
      tags: ["annual", "food", "cool-season"]
    });
    console.log(`  ✅ Success! ID: ${id1}\n`);
  } catch (error: any) {
    console.log(`  ⚠️  ${error.message}\n`);
  }

  // Test 2: Detailed data
  console.log("Test 2: Adding plant with detailed data...");
  try {
    const id2 = await addPlantSimple({
      commonName: "Cucumber",
      variety: "Marketmore 76",
      scientificName: "Cucumis sativus",
      daysToMaturity: 65,
      sunRequirement: "full-sun",
      waterRequirement: "high",
      spacingInches: 12,
      rowSpacingInches: 48,
      plantingMethod: "either",
      seedDepthInches: 0.5,
      germinationDays: 7,
      frostTolerance: "tender",
      directSeedWeeksFromFrost: 2,
      indoorStartWeeksBeforeFrost: 4,
      soilPHMin: 6.0,
      soilPHMax: 7.0,
      minSoilTemp: 60,
      optimalSoilTempMin: 70,
      optimalSoilTempMax: 95,
      source: "Johnny's Selected Seeds",
      productId: "#CU01",
      tags: ["annual", "food", "warm-season", "climbing", "heirloom"],
      notes: "Classic slicing cucumber. Disease-resistant. Excellent flavor."
    });
    console.log(`  ✅ Success! ID: ${id2}\n`);
  } catch (error: any) {
    console.log(`  ⚠️  ${error.message}\n`);
  }

  // Test 3: Flower
  console.log("Test 3: Adding a flower...");
  try {
    const id3 = await addPlantSimple({
      commonName: "Sunflower",
      variety: "Mammoth",
      scientificName: "Helianthus annuus",
      daysToMaturity: 90,
      sunRequirement: "full-sun",
      waterRequirement: "moderate",
      spacingInches: 24,
      plantingMethod: "direct-seed",
      frostTolerance: "tender",
      directSeedWeeksFromFrost: 2,
      tags: ["annual", "flower", "pollinator-friendly", "tall"]
    });
    console.log(`  ✅ Success! ID: ${id3}\n`);
  } catch (error: any) {
    console.log(`  ⚠️  ${error.message}\n`);
  }

  // Test 4: Perennial herb
  console.log("Test 4: Adding a perennial herb...");
  try {
    const id4 = await addPlantSimple({
      commonName: "Oregano",
      variety: "Greek",
      scientificName: "Origanum vulgare subsp. hirtum",
      daysToMaturity: 90,
      sunRequirement: "full-sun",
      waterRequirement: "low",
      spacingInches: 12,
      plantingMethod: "transplant",
      frostTolerance: "hardy",
      tags: ["perennial", "food", "herb", "drought-tolerant", "medicinal"]
    });
    console.log(`  ✅ Success! ID: ${id4}\n`);
  } catch (error: any) {
    console.log(`  ⚠️  ${error.message}\n`);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Test complete!\n");
  console.log("Check the database or run the web server to see the plants:");
  console.log("  pnpm run server");
  console.log("  http://localhost:3000");
}

main().catch(console.error);
