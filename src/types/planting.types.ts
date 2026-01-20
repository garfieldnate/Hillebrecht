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
 * Pruning event for a tree
 */
export interface PruningEvent {
  date: string; // ISO date string
  type: "formative" | "maintenance" | "rejuvenation" | "corrective";
  description?: string;
  notes?: string;
}

/**
 * Yearly data for a tree (multi-year tracking)
 */
export interface TreeYearlyData {
  year: number;

  // Pruning events for this year
  pruningEvents?: PruningEvent[];

  // Harvest data for this year
  harvestData?: {
    yieldAmount?: string; // "50 lbs", "200 apples"
    yieldQuality?: "poor" | "fair" | "good" | "excellent";
    harvestDates?: string[]; // ISO date strings
    notes?: string;
  };

  // Tree health for this year
  treeHealth?: "poor" | "fair" | "good" | "excellent";
  pestsEncountered?: string[];
  diseasesEncountered?: string[];
  notes?: string;
}

/**
 * Tree-specific details for perennial trees
 */
export interface TreeDetails {
  // Rootstock information
  rootstock: {
    name: string; // "M.9", "M.26", "Bud 118", "Standard", etc.
    type?: "dwarf" | "semi-dwarf" | "standard";
    notes?: string;
  };

  // Age tracking
  plantingDate: string; // ISO date string - more precise than year/season
  ageInYears?: number; // Calculated or manual override

  // Tree-specific status
  firstFruitYear?: number; // Year tree first produced fruit
  isEstablished: boolean; // Whether past establishment period (typically 2-3 years)

  // Multi-year tracking
  yearlyData?: TreeYearlyData[];
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

  // Tree-specific data (optional, only for trees)
  treeDetails?: TreeDetails;

  // General notes
  notes?: string;

  // Metadata
  metadata?: {
    dateCreated?: string;
    lastModified?: string;
  };
}
