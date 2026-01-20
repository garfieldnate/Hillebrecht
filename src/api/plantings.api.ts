/**
 * Simplified Plantings API - LLM-Friendly
 *
 * Makes it easy to track what's actually planted in your garden.
 * A planting is a specific instance of a plant variety in a location.
 */

import { db } from "../db/client.ts";
import { plantings, plants } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import type { PlannedPlanting } from "../types/planting.types.ts";
import { Season, PlantingStatus } from "../types/common.types.ts";

/**
 * Simplified planting data
 * Only plantId, year, and season are required
 */
export interface SimplePlantingData {
  // REQUIRED
  plantId: string; // ID of the plant variety (e.g., "tomato-cherokee-purple")
  year: number;
  season: "spring" | "summer" | "fall" | "winter";

  // OPTIONAL - Location
  bedId?: string; // e.g., "bed-a", "raised-bed-1"
  location?: string; // Human-readable location description
  row?: number;
  position?: string;

  // OPTIONAL - Quantities
  quantity?: number; // How many plants
  seedsPlanted?: number; // How many seeds started

  // OPTIONAL - Dates (will use defaults based on season if not provided)
  indoorStartDate?: string; // ISO date
  transplantDate?: string;
  directSeedDate?: string;
  harvestStartDate?: string;
  harvestEndDate?: string;
  removalDate?: string;

  // OPTIONAL - Status
  status?: "planned" | "seeds-started" | "planted" | "growing" | "harvesting" | "finished" | "failed" | "skipped";

  // OPTIONAL - Notes
  notes?: string;
  companionPlantIds?: string[]; // Other plants nearby
}

/**
 * Add a planting to the database
 *
 * @example
 * // Minimal - just plant, year, season
 * await addPlantingSimple({
 *   plantId: "tomato-cherokee-purple",
 *   year: 2026,
 *   season: "spring",
 *   quantity: 6
 * });
 *
 * @example
 * // With location and dates
 * await addPlantingSimple({
 *   plantId: "lettuce-buttercrunch",
 *   year: 2026,
 *   season: "spring",
 *   bedId: "raised-bed-1",
 *   location: "North side, partial shade",
 *   quantity: 12,
 *   directSeedDate: "2026-04-15",
 *   status: "planted"
 * });
 *
 * @example
 * // With transplanting schedule
 * await addPlantingSimple({
 *   plantId: "tomato-san-marzano",
 *   year: 2026,
 *   season: "spring",
 *   bedId: "garden-bed-a",
 *   seedsPlanted: 12,
 *   quantity: 8,
 *   indoorStartDate: "2026-03-15",
 *   transplantDate: "2026-05-20",
 *   status: "seeds-started"
 * });
 */
export async function addPlantingSimple(data: SimplePlantingData): Promise<string> {
  // Generate ID
  const id = generatePlantingId(data.plantId, data.year, data.season, data.bedId);

  // Check if planting already exists
  const existing = await db.select().from(plantings).where(eq(plantings.id, id)).limit(1);
  if (existing.length > 0) {
    throw new Error(`Planting already exists: ${id}`);
  }

  // Get plant info for denormalized fields
  const plant = await db.select().from(plants).where(eq(plants.id, data.plantId)).limit(1);
  if (plant.length === 0) {
    throw new Error(`Plant not found: ${data.plantId}`);
  }

  const now = new Date().toISOString();

  // Build schedule object
  const schedule = buildSchedule(data);

  // Build location object
  const location = {
    bedId: data.bedId || null,
    description: data.location || null,
    row: data.row || null,
    position: data.position || null,
  };

  // Build quantity object
  const quantity = {
    planned: data.quantity || 1,
    seedsPlanted: data.seedsPlanted || null,
    seedsGerminated: null,
    transplanted: null,
    survived: null,
  };

  // Insert planting
  await db.insert(plantings).values({
    id,
    plantId: data.plantId,
    plantName: plant[0].commonName,
    variety: plant[0].variety,
    year: data.year,
    season: parseSeason(data.season) as any,
    schedule: schedule as any,
    location: location as any,
    quantity: quantity as any,
    status: (data.status || "planned") as any,
    results: null,
    treeDetails: null,
    notes: data.notes || null,
    metadata: {
      dateCreated: now,
      dateUpdated: now,
    } as any,
  });

  return id;
}

/**
 * Update planting status
 *
 * @example
 * await updatePlantingStatus("tomato-cherokee-purple-2026-spring-bed-a", "growing");
 *
 * @example
 * await updatePlantingStatus("lettuce-buttercrunch-2026-spring", "harvesting", {
 *   harvestStartDate: "2026-05-15"
 * });
 */
export async function updatePlantingStatus(
  plantingId: string,
  status: "planned" | "seeds-started" | "planted" | "growing" | "harvesting" | "finished" | "failed" | "skipped",
  updates?: {
    indoorStartDate?: string;
    transplantDate?: string;
    directSeedDate?: string;
    harvestStartDate?: string;
    harvestEndDate?: string;
    removalDate?: string;
    notes?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();

  // Get current planting
  const current = await db.select().from(plantings).where(eq(plantings.id, plantingId)).limit(1);
  if (current.length === 0) {
    throw new Error(`Planting not found: ${plantingId}`);
  }

  const currentSchedule = current[0].schedule as any;

  // Update schedule with new dates
  const updatedSchedule = {
    ...currentSchedule,
    indoorStartDate: updates?.indoorStartDate || currentSchedule.indoorStartDate,
    transplantDate: updates?.transplantDate || currentSchedule.transplantDate,
    directSeedDate: updates?.directSeedDate || currentSchedule.directSeedDate,
    harvestStartDate: updates?.harvestStartDate || currentSchedule.harvestStartDate,
    harvestEndDate: updates?.harvestEndDate || currentSchedule.harvestEndDate,
    removalDate: updates?.removalDate || currentSchedule.removalDate,
  };

  await db.update(plantings)
    .set({
      status,
      schedule: updatedSchedule,
      notes: updates?.notes || current[0].notes,
      metadata: {
        ...current[0].metadata as any,
        dateUpdated: now,
      },
    })
    .where(eq(plantings.id, plantingId));
}

/**
 * Log a harvest
 *
 * @example
 * await logHarvest("tomato-cherokee-purple-2026-spring-bed-a", {
 *   date: "2026-07-15",
 *   amount: "5 lbs",
 *   notes: "First major harvest, excellent flavor"
 * });
 */
export async function logHarvest(
  plantingId: string,
  harvest: {
    date: string;
    amount?: string;
    unit?: string;
    notes?: string;
  }
): Promise<void> {
  const current = await db.select().from(plantings).where(eq(plantings.id, plantingId)).limit(1);
  if (current.length === 0) {
    throw new Error(`Planting not found: ${plantingId}`);
  }

  const existingResults = (current[0].results as any) || {};
  const existingHarvests = existingResults.harvests || [];

  const newHarvests = [
    ...existingHarvests,
    {
      date: harvest.date,
      amount: harvest.amount || "N/A",
      unit: harvest.unit || "misc",
      notes: harvest.notes,
    },
  ];

  const updatedResults = {
    ...existingResults,
    harvests: newHarvests,
  };

  await db.update(plantings)
    .set({
      results: updatedResults,
      status: "harvesting",
    })
    .where(eq(plantings.id, plantingId));
}

/**
 * Generate planting ID
 */
function generatePlantingId(plantId: string, year: number, season: string, bedId?: string): string {
  const parts = [plantId, year.toString(), season.toLowerCase()];
  if (bedId) {
    parts.push(bedId);
  }
  return parts.join('-');
}

/**
 * Parse season string to enum
 */
function parseSeason(season: string): Season {
  switch (season.toLowerCase()) {
    case "spring": return Season.Spring;
    case "summer": return Season.Summer;
    case "fall": return Season.Fall;
    case "winter": return Season.Winter;
    default: return Season.Spring;
  }
}

/**
 * Build schedule object with defaults
 */
function buildSchedule(data: SimplePlantingData) {
  return {
    indoorStartDate: data.indoorStartDate || null,
    transplantDate: data.transplantDate || null,
    directSeedDate: data.directSeedDate || null,
    harvestStartDate: data.harvestStartDate || null,
    harvestEndDate: data.harvestEndDate || null,
    removalDate: data.removalDate || null,
  };
}
