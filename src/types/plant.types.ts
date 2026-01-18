/**
 * Plant and seed database types
 */

import type {
  FrostTolerance,
  GrowthHabit,
  PHRange,
  PlantingMethod,
  PlantingWindow,
  SoilRichness,
  SunRequirement,
  WaterRequirement,
} from "./common.types.ts";

/**
 * Different harvest stages for a plant
 */
export interface HarvestInfo {
  stage: string; // e.g., "microgreens", "baby leaves", "mature"
  daysFromPlanting: number;
  description?: string;
  harvestTips?: string;
}

/**
 * Companion planting relationship
 */
export interface CompanionPlant {
  plantId: string;
  plantName: string;
  relationship: "beneficial" | "detrimental";
  reason: string;
  distanceNotes?: string; // e.g., "plant within 2 feet"
}

/**
 * Spacing requirements
 */
export interface Spacing {
  betweenPlants: number; // inches
  betweenRows: number; // inches
  squareFootDensity?: number; // plants per square foot for SFG
}

/**
 * Succession planting configuration
 */
export interface SuccessionPlanting {
  intervalWeeks: number;
  numberOfSuccessions?: number;
  notes?: string;
}

/**
 * Temperature requirements
 */
export interface TemperatureRequirement {
  soilTempMin: number; // Fahrenheit
  soilTempIdeal?: number;
  airTempMin?: number;
  airTempMax?: number;
}

/**
 * Special germination requirements
 */
export interface GerminationRequirements {
  stratification?: {
    type: "cold" | "warm" | "cold-warm" | "warm-cold";
    duration: number; // days
    temperature: number; // Fahrenheit
    notes?: string;
  };
  scarification?: {
    method: "mechanical" | "chemical" | "hot-water";
    notes?: string;
  };
  soaking?: {
    duration: number; // hours
    temperature?: number; // Fahrenheit
    notes?: string;
  };
  lightRequirement?: "light" | "dark" | "either";
  specialNotes?: string;
}

/**
 * Spring planting timing
 */
export interface SpringTiming {
  indoorStart?: PlantingWindow;
  transplant?: PlantingWindow;
  directSeed?: PlantingWindow;
}

/**
 * Fall planting timing
 */
export interface FallTiming {
  indoorStart?: PlantingWindow;
  transplant?: PlantingWindow;
  directSeed?: PlantingWindow;
}

/**
 * Care instructions
 */
export interface CareNotes {
  fertilizing?: string;
  pruning?: string;
  support?: string; // staking, trellising, caging
  mulching?: string;
  commonPests?: string[];
  commonDiseases?: string[];
  preventionTips?: string;
}

/**
 * Complete plant/seed information
 */
export interface Plant {
  // Identity
  id: string;
  commonName: string;
  variety: string;
  scientificName?: string;
  brand?: string;

  // Soil requirements
  soilRichness: SoilRichness[];
  soilPH: PHRange;

  // Spacing
  spacing: Spacing;

  // Planting method and timing
  plantingMethod: PlantingMethod;
  springTiming?: SpringTiming;
  fallTiming?: FallTiming;
  seedDepth: number; // inches
  temperature: TemperatureRequirement;
  germinationDays: number; // typical days to germinate
  germinationRequirements?: GerminationRequirements;

  // Succession planting
  successionPlanting?: SuccessionPlanting;

  // Frost hardiness
  frostTolerance: {
    seedling: FrostTolerance;
    mature: FrostTolerance;
  };

  // Environmental needs
  sunRequirement: SunRequirement;
  waterRequirement: WaterRequirement;
  growthHabit?: GrowthHabit;

  // Harvest information
  harvestStages: HarvestInfo[];

  // Companion planting
  companions?: CompanionPlant[];

  // Care
  care?: CareNotes;

  // General
  tags?: string[];
  notes?: string;
  metadata?: {
    dateAdded?: string;
    lastModified?: string;
    source?: string; // where seed was purchased or info sourced
  };
}
