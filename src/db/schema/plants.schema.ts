import { sqliteTable, text, integer, primaryKey, index, real } from "drizzle-orm/sqlite-core";
import type {
  Spacing,
  SpringTiming,
  FallTiming,
  TemperatureRequirement,
  HarvestInfo,
  GerminationRequirements,
  CareNotes,
  SuccessionPlanting,
} from "../../types/plant.types.ts";
import type {
  PHRange,
  SoilRichness,
} from "../../types/common.types.ts";

/**
 * Main plants table
 * Stores core plant information with JSON columns for complex nested structures
 */
export const plants = sqliteTable("plants", {
  // Identity
  id: text("id").primaryKey(),
  commonName: text("common_name").notNull(),
  variety: text("variety").notNull(),
  scientificName: text("scientific_name"),
  brand: text("brand"),

  // Soil requirements (stored as JSON)
  soilRichness: text("soil_richness", { mode: "json" }).$type<SoilRichness[]>().notNull(),
  soilPH: text("soil_ph", { mode: "json" }).$type<PHRange>().notNull(),

  // Spacing (stored as JSON)
  spacing: text("spacing", { mode: "json" }).$type<Spacing>().notNull(),

  // Planting method and timing
  plantingMethod: text("planting_method")
    .$type<"direct-seed" | "transplant" | "either">()
    .notNull(),
  springTiming: text("spring_timing", { mode: "json" }).$type<SpringTiming>(),
  fallTiming: text("fall_timing", { mode: "json" }).$type<FallTiming>(),
  seedDepth: real("seed_depth").notNull(), // inches
  germinationDays: integer("germination_days").notNull(),
  germinationRequirements: text("germination_requirements", { mode: "json" }).$type<GerminationRequirements>(),

  // Temperature (stored as JSON)
  temperature: text("temperature", { mode: "json" }).$type<TemperatureRequirement>().notNull(),

  // Succession planting (stored as JSON)
  successionPlanting: text("succession_planting", { mode: "json" }).$type<SuccessionPlanting>(),

  // Frost tolerance (stored as JSON object with seedling and mature)
  frostTolerance: text("frost_tolerance", { mode: "json" })
    .$type<{
      seedling: "tender" | "half-hardy" | "hardy" | "very-hardy";
      mature: "tender" | "half-hardy" | "hardy" | "very-hardy";
    }>()
    .notNull(),

  // Environmental needs
  sunRequirement: text("sun_requirement")
    .$type<"full-sun" | "partial-sun" | "partial-shade" | "full-shade">()
    .notNull(),
  waterRequirement: text("water_requirement")
    .$type<"low" | "moderate" | "high">()
    .notNull(),
  growthHabit: text("growth_habit")
    .$type<"determinate" | "indeterminate" | "spreading" | "climbing">(),

  // Harvest information (stored as JSON array)
  harvestStages: text("harvest_stages", { mode: "json" }).$type<HarvestInfo[]>().notNull(),

  // Care notes (stored as JSON)
  care: text("care", { mode: "json" }).$type<CareNotes>(),

  // General
  notes: text("notes"),
  metadata: text("metadata", { mode: "json" }).$type<{
    dateAdded?: string;
    lastModified?: string;
    source?: string;
  }>(),
});

/**
 * Plant tags table
 * Many-to-many relationship for plant tags
 */
export const plantTags = sqliteTable(
  "plant_tags",
  {
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.plantId, table.tag] }),
    tagIdx: index("tag_idx").on(table.tag),
  })
);

/**
 * Plant companions table
 * Many-to-many relationship with additional metadata
 */
export const plantCompanions = sqliteTable(
  "plant_companions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    companionPlantId: text("companion_plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    companionPlantName: text("companion_plant_name").notNull(),
    relationship: text("relationship")
      .$type<"beneficial" | "detrimental">()
      .notNull(),
    reason: text("reason").notNull(),
    distanceNotes: text("distance_notes"),
  },
  (table) => ({
    plantCompanionIdx: index("plant_companion_idx").on(table.plantId, table.companionPlantId),
  })
);
