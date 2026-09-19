/**
 * Backfill Timing Columns
 *
 * One-time script to populate the new flat timing columns for all existing
 * plants.  Safe to re-run — subsequent runs just overwrite with the same values.
 *
 * Run with:
 *   pnpm tsx src/scripts/backfill-timing-columns.ts
 */

import { db } from "../db/client.node.ts";
import { plants } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import { computeDerivedTimingFields } from "../lib/plant-timing.ts";
import type { SpringTiming, FallTiming, GerminationRequirements } from "../types/plant.types.ts";

async function main() {
  const allPlants = await db.select().from(plants);
  console.log(`Processing ${allPlants.length} plants...`);

  let updated = 0;
  let nullSpring = 0;
  let nullFall = 0;
  let withStrat = 0;
  let withSoak = 0;

  for (const plant of allPlants) {
    const derived = computeDerivedTimingFields(
      (plant.springTiming as SpringTiming | null) ?? null,
      (plant.fallTiming as FallTiming | null) ?? null,
      (plant.germinationRequirements as GerminationRequirements | null) ?? null,
    );

    await db.update(plants).set(derived).where(eq(plants.id, plant.id));

    updated++;
    if (derived.springActionStartWeeks === null) nullSpring++;
    if (derived.fallActionStartWeeks   === null) nullFall++;
    if (derived.stratDaysRequired      !== null) withStrat++;
    if (derived.soakHoursRequired      !== null) withSoak++;
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Updated:                 ${updated}`);
  console.log(`  With spring timing:      ${updated - nullSpring}`);
  console.log(`  Without spring timing:   ${nullSpring}`);
  console.log(`  With fall timing:        ${updated - nullFall}`);
  console.log(`  Without fall timing:     ${nullFall}`);
  console.log(`  Require stratification:  ${withStrat}`);
  console.log(`  Require soaking:         ${withSoak}`);
}

main().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
