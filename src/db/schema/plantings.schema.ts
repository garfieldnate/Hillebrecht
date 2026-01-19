import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { plants } from "./plants.schema.ts";
import type {
  PlantingSchedule,
  PlantingLocation,
  PlantingQuantity,
  PlantingResults,
} from "../../types/planting.types.ts";

/**
 * Plantings table
 * Tracks seasonal planting plans with schedules, locations, and results
 */
export const plantings = sqliteTable(
  "plantings",
  {
    // Identity
    id: text("id").primaryKey(),

    // Plant reference (foreign key + denormalized data)
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    plantName: text("plant_name").notNull(),
    variety: text("variety").notNull(),

    // Season
    year: integer("year").notNull(),
    season: text("season")
      .$type<"spring" | "summer" | "fall" | "winter">()
      .notNull(),

    // Schedule (stored as JSON)
    schedule: text("schedule", { mode: "json" }).$type<PlantingSchedule>().notNull(),

    // Location (stored as JSON)
    location: text("location", { mode: "json" }).$type<PlantingLocation>().notNull(),

    // Quantity (stored as JSON)
    quantity: text("quantity", { mode: "json" }).$type<PlantingQuantity>().notNull(),

    // Status
    status: text("status")
      .$type<
        | "planned"
        | "seeds-started"
        | "planted"
        | "growing"
        | "harvesting"
        | "finished"
        | "failed"
        | "skipped"
      >()
      .notNull(),

    // Results (stored as JSON, optional)
    results: text("results", { mode: "json" }).$type<PlantingResults>(),

    // General notes
    notes: text("notes"),

    // Metadata (stored as JSON)
    metadata: text("metadata", { mode: "json" }).$type<{
      dateCreated?: string;
      lastModified?: string;
    }>(),
  },
  (table) => ({
    yearSeasonIdx: index("year_season_idx").on(table.year, table.season),
    statusIdx: index("status_idx").on(table.status),
    plantIdIdx: index("plant_id_idx").on(table.plantId),
  })
);
