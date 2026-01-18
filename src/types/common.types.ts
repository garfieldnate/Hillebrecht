/**
 * Common types and enumerations used across the garden management system
 */

// Sun exposure requirements
export enum SunRequirement {
  FullSun = "full-sun",
  PartialSun = "partial-sun",
  PartialShade = "partial-shade",
  FullShade = "full-shade",
}

// Water needs
export enum WaterRequirement {
  Low = "low",
  Moderate = "moderate",
  High = "high",
}

// Soil nutrient richness
export enum SoilRichness {
  Poor = "poor",
  Moderate = "moderate",
  Rich = "rich",
  VeryRich = "very-rich",
}

// Plant growth patterns
export enum GrowthHabit {
  Determinate = "determinate",
  Indeterminate = "indeterminate",
  Spreading = "spreading",
  Climbing = "climbing",
}

// How the plant is typically started
export enum PlantingMethod {
  DirectSeed = "direct-seed",
  Transplant = "transplant",
  Either = "either",
}

// Cold tolerance levels
export enum FrostTolerance {
  Tender = "tender",           // Killed by light frost
  HalfHardy = "half-hardy",    // Tolerates light frost
  Hardy = "hardy",             // Tolerates moderate frost
  VeryHardy = "very-hardy",    // Tolerates hard frost
}

// Season names
export enum Season {
  Spring = "spring",
  Summer = "summer",
  Fall = "fall",
  Winter = "winter",
}

// Planting status tracking
export enum PlantingStatus {
  Planned = "planned",
  SeedsStarted = "seeds-started",
  Planted = "planted",
  Growing = "growing",
  Harvesting = "harvesting",
  Finished = "finished",
  Failed = "failed",
  Skipped = "skipped",
}

/**
 * Represents timing relative to frost dates
 * Positive values = weeks after frost date
 * Negative values = weeks before frost date
 * Zero = frost date week
 */
export interface FrostRelativeTiming {
  weeksFromFrost: number;
  frostReference: "last-spring-frost" | "first-fall-frost";
}

/**
 * Represents a planting window with earliest and latest timing
 */
export interface PlantingWindow {
  earliest: FrostRelativeTiming;
  latest: FrostRelativeTiming;
}

/**
 * pH Range for soil
 */
export interface PHRange {
  min: number;
  max: number;
  ideal?: number;
}
