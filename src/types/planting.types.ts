/**
 * Seasonal planting plan types
 */

import type { PlantingStatus, Season } from "./common.types.ts";

/**
 * Location information for where plants are planted
 */
export interface PlantingLocation {
  bed: string;
  section?: string;
  row?: string;
  positionNotes?: string;
}

/**
 * Quantity information
 */
export interface PlantingQuantity {
  planned: number;
  unit: "seeds" | "plants" | "feet" | "square-feet";
  actualPlanted?: number;
  survivalCount?: number;
}

/**
 * Schedule with actual dates
 */
export interface PlantingSchedule {
  indoorStartDate?: string; // ISO date string
  transplantDate?: string;
  directSeedDate?: string;
  harvestWindowStart?: string;
  harvestWindowEnd?: string;
}

/**
 * Results tracking for learning year-over-year
 */
export interface PlantingResults {
  germinationRate?: number; // percentage
  plantHealth?: "poor" | "fair" | "good" | "excellent";
  yieldRating?: "poor" | "fair" | "good" | "excellent";
  yieldAmount?: string; // free-form: "10 lbs", "50 tomatoes", etc.
  actualHarvestDates?: string[]; // ISO date strings
  pestsEncountered?: string[];
  diseasesEncountered?: string[];
  whatWorked?: string;
  whatDidntWork?: string;
  wouldPlantAgain?: boolean;
  notes?: string;
}

/**
 * A planned planting for a specific season
 */
export interface PlannedPlanting {
  id: string;

  // Plant reference (denormalized for convenience)
  plantId: string;
  plantName: string;
  variety: string;

  // Season
  year: number;
  season: Season;

  // Schedule
  schedule: PlantingSchedule;

  // Location
  location: PlantingLocation;

  // Quantity
  quantity: PlantingQuantity;

  // Status
  status: PlantingStatus;

  // Results (optional, filled in after harvest)
  results?: PlantingResults;

  // General notes
  notes?: string;

  // Metadata
  metadata?: {
    dateCreated?: string;
    lastModified?: string;
  };
}
