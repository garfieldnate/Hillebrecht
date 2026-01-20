/**
 * Simplified Plant API - LLM-Friendly
 *
 * This API makes it extremely easy to add plants to the database.
 * Just provide the essential information and sensible defaults will be used.
 *
 * Usage for LLMs:
 * 1. Research the plant online
 * 2. Fill in as many fields as you can find
 * 3. Use sensible defaults for missing data
 * 4. Call addPlantSimple() with the data
 */

import { db } from "../db/client.ts";
import { plants, plantTags, plantCompanions } from "../db/schema/index.ts";
import type { Plant } from "../types/plant.types.ts";
import {
  SoilRichness,
  SunRequirement,
  WaterRequirement,
  FrostTolerance,
  PlantingMethod,
  Season,
} from "../types/common.types.ts";

/**
 * Simplified plant data for easy entry
 * Only the essential fields are required, everything else is optional
 */
export interface SimplePlantData {
  // REQUIRED - Basic identification
  commonName: string;
  variety: string;

  // OPTIONAL - Additional identification
  scientificName?: string;
  brand?: string;

  // OPTIONAL - Growing requirements (will use defaults if not provided)
  daysToMaturity?: number; // Default: 60
  sunRequirement?: "full-sun" | "partial-sun" | "partial-shade" | "full-shade"; // Default: "full-sun"
  waterRequirement?: "low" | "moderate" | "high"; // Default: "moderate"

  // OPTIONAL - Spacing (will use defaults)
  spacingInches?: number; // Distance between plants, default: 12
  rowSpacingInches?: number; // Distance between rows, default: 18

  // OPTIONAL - Soil
  soilPHMin?: number; // Default: 6.0
  soilPHMax?: number; // Default: 7.0
  soilRichness?: ("poor" | "moderate" | "rich" | "very-rich")[]; // Default: ["moderate"]

  // OPTIONAL - Planting
  plantingMethod?: "direct-seed" | "transplant" | "either"; // Default: "either"
  seedDepthInches?: number; // Default: 0.25
  germinationDays?: number; // Default: 7-14

  // OPTIONAL - Temperature
  minSoilTemp?: number; // Fahrenheit, default: 50
  optimalSoilTempMin?: number; // Default: 60
  optimalSoilTempMax?: number; // Default: 85

  // OPTIONAL - Frost tolerance
  frostTolerance?: "tender" | "half-hardy" | "hardy" | "very-hardy"; // Default: "tender"

  // OPTIONAL - Timing (weeks from last spring frost)
  indoorStartWeeksBeforeFrost?: number; // Default: null (no indoor start)
  transplantWeeksFromFrost?: number; // Default: 0 (at frost date)
  directSeedWeeksFromFrost?: number; // Default: 2 (2 weeks after frost)

  // OPTIONAL - Tags for organization
  tags?: string[]; // e.g., ["annual", "food", "heirloom", "baker-creek"]

  // OPTIONAL - Source/distributor
  source?: string; // e.g., "Baker Creek Heirloom Seeds"
  productId?: string; // e.g., "#TOM12"

  // OPTIONAL - Notes
  notes?: string;
}

/**
 * Add a plant to the database with minimal required information
 *
 * This function is designed to be very forgiving and use sensible defaults
 * for any missing data. LLMs should research as much as they can find easily,
 * but don't need to find every single field.
 *
 * @example
 * // Minimal usage - just provide the basics
 * await addPlantSimple({
 *   commonName: "Tomato",
 *   variety: "Cherokee Purple",
 *   tags: ["annual", "food", "heirloom"]
 * });
 *
 * @example
 * // With more detail
 * await addPlantSimple({
 *   commonName: "Tomato",
 *   variety: "San Marzano",
 *   scientificName: "Solanum lycopersicum",
 *   daysToMaturity: 80,
 *   sunRequirement: "full-sun",
 *   waterRequirement: "moderate",
 *   spacingInches: 24,
 *   plantingMethod: "transplant",
 *   indoorStartWeeksBeforeFrost: 6,
 *   tags: ["annual", "food", "determinate", "sauce-tomato"],
 *   source: "Baker Creek",
 *   productId: "#TOM45"
 * });
 */
export async function addPlantSimple(data: SimplePlantData): Promise<string> {
  // Generate ID from common name and variety
  const id = generatePlantId(data.commonName, data.variety);

  // Check if plant already exists
  const existing = await db.select().from(plants).where(eq(plants.id, id)).limit(1);
  if (existing.length > 0) {
    throw new Error(`Plant already exists: ${data.commonName} - ${data.variety}`);
  }

  // Build full plant object with defaults
  const plant: Plant = {
    id,
    commonName: data.commonName,
    variety: data.variety,
    scientificName: data.scientificName,
    brand: data.brand,

    // Soil
    soilRichness: data.soilRichness?.map(r =>
      r === "poor" ? SoilRichness.Poor :
      r === "rich" ? SoilRichness.Rich :
      r === "very-rich" ? SoilRichness.VeryRich :
      SoilRichness.Moderate
    ) || [SoilRichness.Moderate],
    soilPH: {
      min: data.soilPHMin ?? 6.0,
      max: data.soilPHMax ?? 7.0,
    },

    // Spacing
    spacing: {
      betweenPlants: data.spacingInches ?? 12,
      betweenRows: data.rowSpacingInches ?? 18,
      squareFootDensity: calculateSquareFootDensity(
        data.spacingInches ?? 12,
        data.rowSpacingInches ?? 18
      ),
    },

    // Planting
    plantingMethod: data.plantingMethod === "direct-seed" ? PlantingMethod.DirectSeed :
                     data.plantingMethod === "transplant" ? PlantingMethod.Transplant :
                     PlantingMethod.Either,
    seedDepth: data.seedDepthInches ?? 0.25,
    germinationDays: data.germinationDays ?? 10,

    // Timing
    springTiming: buildSpringTiming(data),

    // Temperature
    temperature: {
      soilTempMin: data.minSoilTemp ?? 50,
      soilTempIdeal: data.optimalSoilTempMin ?? 70,
    },

    // Frost tolerance
    frostTolerance: {
      seedling: parseFrostTolerance(data.frostTolerance ?? "tender"),
      mature: parseFrostTolerance(data.frostTolerance ?? "tender"),
    },

    // Environmental needs
    sunRequirement: data.sunRequirement === "partial-sun" ? SunRequirement.PartialSun :
                     data.sunRequirement === "partial-shade" ? SunRequirement.PartialShade :
                     data.sunRequirement === "full-shade" ? SunRequirement.FullShade :
                     SunRequirement.FullSun,
    waterRequirement: data.waterRequirement === "low" ? WaterRequirement.Low :
                      data.waterRequirement === "high" ? WaterRequirement.High :
                      WaterRequirement.Moderate,

    // Harvest
    harvestStages: [{
      stage: "mature",
      daysFromPlanting: data.daysToMaturity ?? 60,
      description: "Ready to harvest",
    }],

    // Tags
    tags: data.tags,

    // Metadata
    notes: data.notes,
    metadata: {
      dateAdded: new Date().toISOString(),
      source: data.source,
    },
  };

  // Insert plant
  await db.insert(plants).values({
    id: plant.id,
    commonName: plant.commonName,
    variety: plant.variety,
    scientificName: plant.scientificName || null,
    brand: plant.brand || null,
    soilRichness: plant.soilRichness,
    soilPH: plant.soilPH,
    spacing: plant.spacing,
    plantingMethod: plant.plantingMethod,
    springTiming: plant.springTiming || null,
    fallTiming: null,
    seedDepth: plant.seedDepth,
    germinationDays: plant.germinationDays,
    germinationRequirements: null,
    temperature: plant.temperature,
    successionPlanting: null,
    frostTolerance: plant.frostTolerance,
    sunRequirement: plant.sunRequirement,
    waterRequirement: plant.waterRequirement,
    growthHabit: null,
    harvestStages: plant.harvestStages,
    care: null,
    pollinationInfo: null,
    rootstockOptions: null,
    notes: plant.notes || null,
    metadata: plant.metadata || null,
  });

  // Insert tags
  if (plant.tags && plant.tags.length > 0) {
    await db.insert(plantTags).values(
      plant.tags.map(tag => ({ plantId: plant.id, tag }))
    );
  }

  return id;
}

/**
 * Generate a plant ID from common name and variety
 * Converts to lowercase, replaces spaces with hyphens
 */
function generatePlantId(commonName: string, variety: string): string {
  const combined = `${commonName}-${variety}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return combined;
}

/**
 * Calculate square foot density from inches
 */
function calculateSquareFootDensity(betweenPlants: number, betweenRows: number): number {
  const sqInches = betweenPlants * betweenRows;
  const plantsPerSqFt = 144 / sqInches;
  return Math.round(plantsPerSqFt * 10) / 10;
}

/**
 * Build spring timing from simple data
 */
function buildSpringTiming(data: SimplePlantData) {
  const hasIndoorStart = data.indoorStartWeeksBeforeFrost !== undefined;
  const hasTransplant = data.transplantWeeksFromFrost !== undefined;
  const hasDirectSeed = data.directSeedWeeksFromFrost !== undefined;

  if (!hasIndoorStart && !hasTransplant && !hasDirectSeed) {
    // Default timing
    return {
      directSeed: {
        earliest: { weeksFromFrost: 0, frostReference: "last-spring-frost" as const },
        latest: { weeksFromFrost: 4, frostReference: "last-spring-frost" as const },
      },
    };
  }

  const timing: any = {};

  if (hasIndoorStart) {
    timing.indoorStart = {
      earliest: { weeksFromFrost: -(data.indoorStartWeeksBeforeFrost!), frostReference: "last-spring-frost" as const },
      latest: { weeksFromFrost: -(data.indoorStartWeeksBeforeFrost! - 2), frostReference: "last-spring-frost" as const },
    };
  }

  if (hasTransplant) {
    timing.transplant = {
      earliest: { weeksFromFrost: data.transplantWeeksFromFrost!, frostReference: "last-spring-frost" as const },
      latest: { weeksFromFrost: (data.transplantWeeksFromFrost! + 3), frostReference: "last-spring-frost" as const },
    };
  }

  if (hasDirectSeed) {
    timing.directSeed = {
      earliest: { weeksFromFrost: data.directSeedWeeksFromFrost!, frostReference: "last-spring-frost" as const },
      latest: { weeksFromFrost: (data.directSeedWeeksFromFrost! + 4), frostReference: "last-spring-frost" as const },
    };
  }

  return timing;
}

/**
 * Parse frost tolerance string to enum
 */
function parseFrostTolerance(value: string): FrostTolerance {
  switch (value) {
    case "tender": return FrostTolerance.Tender;
    case "half-hardy": return FrostTolerance.HalfHardy;
    case "hardy": return FrostTolerance.Hardy;
    case "very-hardy": return FrostTolerance.VeryHardy;
    default: return FrostTolerance.Tender;
  }
}

// Re-export for convenience
import { eq } from "drizzle-orm";
