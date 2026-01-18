/**
 * Planting plan database
 */

import { type PlantingStatus, Season } from "../types/common.types.ts";
import type { PlannedPlanting } from "../types/planting.types.ts";

/**
 * Database of planned plantings
 * Start with an empty array - users will populate with their seasonal plans
 */
export const plantingsDatabase: PlannedPlanting[] = [];

/**
 * Get all plantings for a specific season
 */
export function getPlantingsBySeason(
  year: number,
  season: Season
): PlannedPlanting[] {
  return plantingsDatabase.filter(
    (planting) => planting.year === year && planting.season === season
  );
}

/**
 * Get plantings by status
 */
export function getPlantingsByStatus(
  status: PlantingStatus
): PlannedPlanting[] {
  return plantingsDatabase.filter((planting) => planting.status === status);
}

/**
 * Get all plantings in a specific bed
 */
export function getPlantingsByBed(bedId: string): PlannedPlanting[] {
  return plantingsDatabase.filter(
    (planting) => planting.location.bed === bedId
  );
}

/**
 * Get plantings for a specific plant
 */
export function getPlantingsByPlantId(plantId: string): PlannedPlanting[] {
  return plantingsDatabase.filter((planting) => planting.plantId === plantId);
}

/**
 * Get a planting by ID
 */
export function getPlantingById(id: string): PlannedPlanting | undefined {
  return plantingsDatabase.find((planting) => planting.id === id);
}

/**
 * Get current season's plantings
 */
export function getCurrentSeasonPlantings(): PlannedPlanting[] {
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
export function getUpcomingPlantings(
  daysAhead: number = 14
): PlannedPlanting[] {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return plantingsDatabase.filter((planting) => {
    // Check if any scheduled dates fall within the window
    const dates = [
      planting.schedule.indoorStartDate,
      planting.schedule.transplantDate,
      planting.schedule.directSeedDate,
    ].filter((date): date is string => date !== undefined);

    return dates.some((dateStr) => {
      const date = new Date(dateStr);
      return date >= now && date <= futureDate;
    });
  });
}

/**
 * Add a new planting to the database
 */
export function addPlanting(planting: PlannedPlanting): void {
  // Check for duplicate ID
  if (plantingsDatabase.some((p) => p.id === planting.id)) {
    throw new Error(`Planting with ID ${planting.id} already exists`);
  }
  plantingsDatabase.push(planting);
}

/**
 * Update an existing planting
 */
export function updatePlanting(
  id: string,
  updates: Partial<PlannedPlanting>
): PlannedPlanting | undefined {
  const index = plantingsDatabase.findIndex((p) => p.id === id);
  if (index === -1) {
    return undefined;
  }

  plantingsDatabase[index] = {
    ...plantingsDatabase[index],
    ...updates,
    id, // Ensure ID doesn't change
  };

  return plantingsDatabase[index];
}

/**
 * Delete a planting
 */
export function deletePlanting(id: string): boolean {
  const index = plantingsDatabase.findIndex((p) => p.id === id);
  if (index === -1) {
    return false;
  }
  plantingsDatabase.splice(index, 1);
  return true;
}
