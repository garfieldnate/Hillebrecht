/**
 * Plant database with example seed inventory
 */

import {
  FrostTolerance,
  GrowthHabit,
  PlantingMethod,
  SoilRichness,
  SunRequirement,
  WaterRequirement,
} from "../types/common.types.ts";
import type { Plant } from "../types/plant.types.ts";

export const plantsDatabase: Plant[] = [
  {
    id: "tomato-cherokee-purple",
    commonName: "Tomato",
    variety: "Cherokee Purple",
    scientificName: "Solanum lycopersicum",
    brand: "Baker Creek Heirloom Seeds",

    soilRichness: [SoilRichness.Rich, SoilRichness.VeryRich],
    soilPH: {
      min: 6.0,
      max: 6.8,
      ideal: 6.5,
    },

    spacing: {
      betweenPlants: 24,
      betweenRows: 36,
      squareFootDensity: 1,
    },

    plantingMethod: PlantingMethod.Transplant,
    springTiming: {
      indoorStart: {
        earliest: { weeksFromFrost: -6, frostReference: "last-spring-frost" },
        latest: { weeksFromFrost: -4, frostReference: "last-spring-frost" },
      },
      transplant: {
        earliest: { weeksFromFrost: 0, frostReference: "last-spring-frost" },
        latest: { weeksFromFrost: 2, frostReference: "last-spring-frost" },
      },
    },

    seedDepth: 0.25,
    temperature: {
      soilTempMin: 60,
      soilTempIdeal: 70,
      airTempMin: 55,
      airTempMax: 95,
    },
    germinationDays: 7,

    frostTolerance: {
      seedling: FrostTolerance.Tender,
      mature: FrostTolerance.Tender,
    },

    sunRequirement: SunRequirement.FullSun,
    waterRequirement: WaterRequirement.Moderate,
    growthHabit: GrowthHabit.Indeterminate,

    harvestStages: [
      {
        stage: "green",
        daysFromPlanting: 70,
        description: "Green tomatoes for frying or pickling",
      },
      {
        stage: "mature",
        daysFromPlanting: 80,
        description: "Deep purple-red color, rich flavor",
        harvestTips:
          "Pick when fruit is fully colored and slightly soft to touch. Indeterminate variety produces continuously until frost.",
      },
    ],

    companions: [
      {
        plantId: "basil-genovese",
        plantName: "Basil",
        relationship: "beneficial",
        reason: "Improves flavor and repels aphids, whiteflies, and hornworms",
        distanceNotes: "Plant within 1-2 feet",
      },
      {
        plantId: "marigold-french",
        plantName: "Marigold",
        relationship: "beneficial",
        reason: "Deters nematodes and other pests",
        distanceNotes: "Plant around perimeter of bed",
      },
      {
        plantId: "potato-yukon-gold",
        plantName: "Potato",
        relationship: "detrimental",
        reason:
          "Both are nightshades, compete for nutrients and share diseases",
      },
      {
        plantId: "brassicas",
        plantName: "Brassicas (Cabbage family)",
        relationship: "detrimental",
        reason: "Tomatoes can stunt brassica growth",
      },
    ],

    care: {
      fertilizing:
        "Feed with balanced fertilizer at transplant, then switch to low-nitrogen high-potassium when flowering begins. Side-dress with compost monthly.",
      pruning:
        "Remove suckers for larger fruit and better air circulation. Prune lower leaves as plant grows.",
      support:
        "Requires sturdy stakes or cages. Indeterminate varieties need 6-8 ft support.",
      mulching:
        "Mulch heavily to retain moisture and prevent soil-borne disease splash",
      commonPests: ["Hornworms", "Aphids", "Whiteflies", "Cutworms"],
      commonDiseases: [
        "Early Blight",
        "Late Blight",
        "Blossom End Rot",
        "Fusarium Wilt",
      ],
      preventionTips:
        "Rotate crops yearly, avoid overhead watering, ensure good air circulation, remove diseased foliage immediately",
    },

    tags: ["heirloom", "indeterminate", "warm-season", "nightshade"],
    notes:
      "Cherokee Purple is a classic heirloom with exceptional flavor. Originated with Cherokee people in Tennessee. Fruits can weigh 10-12 oz.",
    metadata: {
      dateAdded: "2026-01-17",
      source: "Baker Creek Heirloom Seeds",
    },
  },

  {
    id: "lettuce-black-seeded-simpson",
    commonName: "Lettuce",
    variety: "Black Seeded Simpson",
    scientificName: "Lactuca sativa",
    brand: "Johnny's Selected Seeds",

    soilRichness: [SoilRichness.Moderate, SoilRichness.Rich],
    soilPH: {
      min: 6.0,
      max: 7.0,
      ideal: 6.5,
    },

    spacing: {
      betweenPlants: 8,
      betweenRows: 12,
      squareFootDensity: 4,
    },

    plantingMethod: PlantingMethod.DirectSeed,
    springTiming: {
      directSeed: {
        earliest: { weeksFromFrost: -4, frostReference: "last-spring-frost" },
        latest: { weeksFromFrost: 2, frostReference: "last-spring-frost" },
      },
    },
    fallTiming: {
      directSeed: {
        earliest: { weeksFromFrost: -8, frostReference: "first-fall-frost" },
        latest: { weeksFromFrost: -4, frostReference: "first-fall-frost" },
      },
    },

    seedDepth: 0.25,
    temperature: {
      soilTempMin: 40,
      soilTempIdeal: 60,
      airTempMax: 75,
    },
    germinationDays: 7,

    successionPlanting: {
      intervalWeeks: 2,
      numberOfSuccessions: 6,
      notes:
        "Stop succession planting when daytime temps consistently exceed 75°F",
    },

    frostTolerance: {
      seedling: FrostTolerance.Hardy,
      mature: FrostTolerance.Hardy,
    },

    sunRequirement: SunRequirement.PartialSun,
    waterRequirement: WaterRequirement.Moderate,

    harvestStages: [
      {
        stage: "microgreens",
        daysFromPlanting: 10,
        description: "Tender micro greens for salads",
        harvestTips: "Cut with scissors just above soil line",
      },
      {
        stage: "baby-leaf",
        daysFromPlanting: 28,
        description: "Baby leaf lettuce, 4-6 inches tall",
        harvestTips:
          "Cut-and-come-again harvest: cut outer leaves, leave center to regrow",
      },
      {
        stage: "mature",
        daysFromPlanting: 45,
        description: "Full-size loose-leaf lettuce heads",
        harvestTips:
          "Harvest entire plant at base or continue cut-and-come-again harvesting. Best flavor before bolting.",
      },
    ],

    companions: [
      {
        plantId: "radish-cherry-belle",
        plantName: "Radish",
        relationship: "beneficial",
        reason:
          "Radishes mature quickly and help break up soil for lettuce roots",
        distanceNotes: "Interplant between lettuce plants",
      },
      {
        plantId: "carrot-nantes",
        plantName: "Carrot",
        relationship: "beneficial",
        reason: "Complementary root depths, both prefer cool weather",
      },
      {
        plantId: "alliums",
        plantName: "Onions/Garlic",
        relationship: "beneficial",
        reason: "Help repel aphids and other pests",
      },
    ],

    care: {
      fertilizing:
        "Light feeder. Side-dress with compost or apply dilute fish emulsion every 2-3 weeks",
      mulching:
        "Light mulch to keep soil cool and retain moisture, especially in warm weather",
      commonPests: ["Aphids", "Slugs", "Snails", "Leaf miners"],
      commonDiseases: ["Downy Mildew", "Bottom Rot", "Tip Burn"],
      preventionTips:
        "Ensure good air circulation, avoid overhead watering late in day, provide afternoon shade in warm weather to prevent bolting",
    },

    tags: [
      "cool-season",
      "succession-plant",
      "cut-and-come-again",
      "frost-hardy",
    ],
    notes:
      "Black Seeded Simpson is a reliable, heat-tolerant loose-leaf variety. One of the easiest lettuces to grow. Excellent for beginners and succession planting.",
    metadata: {
      dateAdded: "2026-01-17",
      source: "Johnny's Selected Seeds",
    },
  },
];

/**
 * Get a plant by ID
 */
export function getPlantById(id: string): Plant | undefined {
  return plantsDatabase.find((plant) => plant.id === id);
}

/**
 * Search plants by name or variety (case-insensitive)
 */
export function searchPlants(query: string): Plant[] {
  const lowerQuery = query.toLowerCase();
  return plantsDatabase.filter(
    (plant) =>
      plant.commonName.toLowerCase().includes(lowerQuery) ||
      plant.variety.toLowerCase().includes(lowerQuery) ||
      plant.scientificName?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get plants by tag
 */
export function getPlantsByTag(tag: string): Plant[] {
  const lowerTag = tag.toLowerCase();
  return plantsDatabase.filter((plant) =>
    plant.tags?.some((t) => t.toLowerCase() === lowerTag)
  );
}

/**
 * Get all unique tags in the database
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  plantsDatabase.forEach((plant) => {
    plant.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
