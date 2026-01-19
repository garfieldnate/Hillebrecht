/**
 * Plant query functions
 * Replicates functionality from plants.db.ts using Drizzle ORM
 */

import { db } from "../client.ts";
import { plants, plantTags, plantCompanions } from "../schema/index.ts";
import { eq, like, sql, or } from "drizzle-orm";
import type { Plant } from "../../types/plant.types.ts";
import {
  FrostTolerance,
  GrowthHabit,
  PlantingMethod,
  SunRequirement,
  WaterRequirement,
} from "../../types/common.types.ts";

/**
 * Helper to convert string values to enum values
 */
function toPlantingMethod(value: string): PlantingMethod {
  const map: Record<string, PlantingMethod> = {
    "direct-seed": PlantingMethod.DirectSeed,
    "transplant": PlantingMethod.Transplant,
    "either": PlantingMethod.Either,
  };
  return map[value] || value as any;
}

function toFrostTolerance(value: string): FrostTolerance {
  const map: Record<string, FrostTolerance> = {
    "tender": FrostTolerance.Tender,
    "half-hardy": FrostTolerance.HalfHardy,
    "hardy": FrostTolerance.Hardy,
    "very-hardy": FrostTolerance.VeryHardy,
  };
  return map[value] || value as any;
}

function toSunRequirement(value: string): SunRequirement {
  const map: Record<string, SunRequirement> = {
    "full-sun": SunRequirement.FullSun,
    "partial-sun": SunRequirement.PartialSun,
    "partial-shade": SunRequirement.PartialShade,
    "full-shade": SunRequirement.FullShade,
  };
  return map[value] || value as any;
}

function toWaterRequirement(value: string): WaterRequirement {
  const map: Record<string, WaterRequirement> = {
    "low": WaterRequirement.Low,
    "moderate": WaterRequirement.Moderate,
    "high": WaterRequirement.High,
  };
  return map[value] || value as any;
}

function toGrowthHabit(value: string | null): GrowthHabit | undefined {
  if (!value) return undefined;
  const map: Record<string, GrowthHabit> = {
    "determinate": GrowthHabit.Determinate,
    "indeterminate": GrowthHabit.Indeterminate,
    "spreading": GrowthHabit.Spreading,
    "climbing": GrowthHabit.Climbing,
  };
  return map[value] || value as any;
}

/**
 * Get a plant by its ID
 */
export async function getPlantById(id: string): Promise<Plant | undefined> {
  const result = await db
    .select()
    .from(plants)
    .where(eq(plants.id, id))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }

  const plant = result[0];

  // Get tags for this plant
  const tags = await db
    .select({ tag: plantTags.tag })
    .from(plantTags)
    .where(eq(plantTags.plantId, id));

  // Get companions for this plant
  const companions = await db
    .select()
    .from(plantCompanions)
    .where(eq(plantCompanions.plantId, id));

  // Reconstruct the Plant object
  return {
    id: plant.id,
    commonName: plant.commonName,
    variety: plant.variety,
    scientificName: plant.scientificName || undefined,
    brand: plant.brand || undefined,
    soilRichness: plant.soilRichness,
    soilPH: plant.soilPH,
    spacing: plant.spacing,
    plantingMethod: toPlantingMethod(plant.plantingMethod),
    springTiming: plant.springTiming || undefined,
    fallTiming: plant.fallTiming || undefined,
    seedDepth: plant.seedDepth,
    temperature: plant.temperature,
    germinationDays: plant.germinationDays,
    germinationRequirements: plant.germinationRequirements || undefined,
    successionPlanting: plant.successionPlanting || undefined,
    frostTolerance: {
      seedling: toFrostTolerance(plant.frostTolerance.seedling),
      mature: toFrostTolerance(plant.frostTolerance.mature),
    },
    sunRequirement: toSunRequirement(plant.sunRequirement),
    waterRequirement: toWaterRequirement(plant.waterRequirement),
    growthHabit: toGrowthHabit(plant.growthHabit),
    harvestStages: plant.harvestStages,
    companions: companions.length > 0
      ? companions.map((c) => ({
          plantId: c.companionPlantId,
          plantName: c.companionPlantName,
          relationship: c.relationship,
          reason: c.reason,
          distanceNotes: c.distanceNotes || undefined,
        }))
      : undefined,
    care: plant.care || undefined,
    tags: tags.length > 0 ? tags.map((t) => t.tag) : undefined,
    notes: plant.notes || undefined,
    metadata: plant.metadata || undefined,
  };
}

/**
 * Search for plants by common name or variety
 * Case-insensitive partial matching
 */
export async function searchPlants(query: string): Promise<Plant[]> {
  const searchPattern = `%${query}%`;

  const results = await db
    .select()
    .from(plants)
    .where(
      or(
        like(plants.commonName, searchPattern),
        like(plants.variety, searchPattern)
      )
    );

  // Get full plant objects with tags and companions
  const fullPlants: Plant[] = [];
  for (const result of results) {
    const plant = await getPlantById(result.id);
    if (plant) {
      fullPlants.push(plant);
    }
  }

  return fullPlants;
}

/**
 * Get all plants that have a specific tag
 */
export async function getPlantsByTag(tag: string): Promise<Plant[]> {
  const plantIds = await db
    .select({ plantId: plantTags.plantId })
    .from(plantTags)
    .where(eq(plantTags.tag, tag));

  const fullPlants: Plant[] = [];
  for (const { plantId } of plantIds) {
    const plant = await getPlantById(plantId);
    if (plant) {
      fullPlants.push(plant);
    }
  }

  return fullPlants;
}

/**
 * Get all unique tags across all plants
 */
export async function getAllTags(): Promise<string[]> {
  const results = await db
    .selectDistinct({ tag: plantTags.tag })
    .from(plantTags)
    .orderBy(plantTags.tag);

  return results.map((r) => r.tag);
}
