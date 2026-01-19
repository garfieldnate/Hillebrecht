/**
 * Planting query functions
 * Replicates functionality from plantings.db.ts using Drizzle ORM
 */

import { db } from "../client.ts";
import { plantings } from "../schema/index.ts";
import { eq, and, sql } from "drizzle-orm";
import { type PlantingStatus, Season } from "../../types/common.types.ts";
import type { PlannedPlanting } from "../../types/planting.types.ts";

/**
 * Get all plantings for a specific season
 */
export async function getPlantingsBySeason(
  year: number,
  season: Season
): Promise<PlannedPlanting[]> {
  const results = await db
    .select()
    .from(plantings)
    .where(and(eq(plantings.year, year), eq(plantings.season, season)));

  return results as PlannedPlanting[];
}

/**
 * Get plantings by status
 */
export async function getPlantingsByStatus(
  status: PlantingStatus
): Promise<PlannedPlanting[]> {
  const results = await db
    .select()
    .from(plantings)
    .where(eq(plantings.status, status));

  return results as PlannedPlanting[];
}

/**
 * Get all plantings in a specific bed
 * Note: location is stored as JSON, so we use SQL to query JSON field
 */
export async function getPlantingsByBed(bedId: string): Promise<PlannedPlanting[]> {
  const results = await db
    .select()
    .from(plantings)
    .where(sql`json_extract(${plantings.location}, '$.bed') = ${bedId}`);

  return results as PlannedPlanting[];
}

/**
 * Get plantings for a specific plant
 */
export async function getPlantingsByPlantId(plantId: string): Promise<PlannedPlanting[]> {
  const results = await db
    .select()
    .from(plantings)
    .where(eq(plantings.plantId, plantId));

  return results as PlannedPlanting[];
}

/**
 * Get a planting by ID
 */
export async function getPlantingById(id: string): Promise<PlannedPlanting | undefined> {
  const results = await db
    .select()
    .from(plantings)
    .where(eq(plantings.id, id))
    .limit(1);

  return results.length > 0 ? (results[0] as PlannedPlanting) : undefined;
}

/**
 * Get current season's plantings
 */
export async function getCurrentSeasonPlantings(): Promise<PlannedPlanting[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Determine current season based on month
  let season: Season;
  if (month >= 2 && month <= 4) {
    season = Season.Spring;
  } else if (month >= 5 && month <= 7) {
    season = Season.Summer;
  } else if (month >= 8 && month <= 10) {
    season = Season.Fall;
  } else {
    season = Season.Winter;
  }

  return getPlantingsBySeason(year, season);
}

/**
 * Get plantings that need attention (seeds to start, time to transplant, etc.)
 */
export async function getUpcomingPlantings(
  daysAhead: number = 14
): Promise<PlannedPlanting[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // Get all plantings and filter in JavaScript
  // (JSON date filtering in SQL would be complex and database-specific)
  const allPlantings = await db.select().from(plantings);

  return allPlantings.filter((planting) => {
    const p = planting as PlannedPlanting;
    // Check if any scheduled dates fall within the window
    const dates = [
      p.schedule.indoorStartDate,
      p.schedule.transplantDate,
      p.schedule.directSeedDate,
    ].filter((date): date is string => date !== undefined);

    return dates.some((dateStr) => {
      const date = new Date(dateStr);
      return date >= now && date <= futureDate;
    });
  }) as PlannedPlanting[];
}

/**
 * Add a new planting to the database
 */
export async function addPlanting(planting: PlannedPlanting): Promise<void> {
  // Check for duplicate ID
  const existing = await getPlantingById(planting.id);
  if (existing) {
    throw new Error(`Planting with ID ${planting.id} already exists`);
  }

  await db.insert(plantings).values({
    id: planting.id,
    plantId: planting.plantId,
    plantName: planting.plantName,
    variety: planting.variety,
    year: planting.year,
    season: planting.season,
    schedule: planting.schedule,
    location: planting.location,
    quantity: planting.quantity,
    status: planting.status,
    results: planting.results,
    notes: planting.notes,
    metadata: planting.metadata,
  });
}

/**
 * Update an existing planting
 */
export async function updatePlanting(
  id: string,
  updates: Partial<PlannedPlanting>
): Promise<PlannedPlanting | undefined> {
  const existing = await getPlantingById(id);
  if (!existing) {
    return undefined;
  }

  // Build the update object, excluding the id field
  const { id: _omitId, ...updateFields } = updates;

  await db
    .update(plantings)
    .set(updateFields as any)
    .where(eq(plantings.id, id));

  return getPlantingById(id);
}

/**
 * Delete a planting
 */
export async function deletePlanting(id: string): Promise<boolean> {
  const existing = await getPlantingById(id);
  if (!existing) {
    return false;
  }

  await db.delete(plantings).where(eq(plantings.id, id));
  return true;
}
