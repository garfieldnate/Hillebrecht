import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import type {
  RecurrencePattern,
  TaskAppliesTo,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskOutcome,
  TaskContext,
  DependencyType,
} from "../../types/task.types.ts";

/**
 * Task templates table
 * Stores the general pattern for recurring tasks
 */
export const taskTemplates = sqliteTable(
  "task_templates",
  {
    // Identity
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),

    // Categorization
    category: text("category").$type<TaskCategory>().notNull(),

    // Recurrence (stored as JSON)
    recurrence: text("recurrence", { mode: "json" }).$type<RecurrencePattern>().notNull(),

    // Targeting (stored as JSON)
    appliesTo: text("applies_to", { mode: "json" }).$type<TaskAppliesTo>(),

    // Task content
    instructions: text("instructions"),
    estimatedMinutes: integer("estimated_minutes"),
    supplies: text("supplies", { mode: "json" }).$type<string[]>(),
    priority: text("priority").$type<TaskPriority>(),

    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

    // Metadata
    notes: text("notes"),
    createdBy: text("created_by"),
    metadata: text("metadata", { mode: "json" }).$type<{
      dateCreated?: string;
      lastModified?: string;
    }>(),
  },
  (table) => ({
    categoryIdx: index("template_category_idx").on(table.category),
    activeIdx: index("template_active_idx").on(table.isActive),
  })
);

/**
 * Task instances table
 * Stores specific scheduled occurrences of tasks
 */
export const taskInstances = sqliteTable(
  "task_instances",
  {
    // Identity
    id: text("id").primaryKey(),
    templateId: text("template_id").references(() => taskTemplates.id, { onDelete: "set null" }),

    // Instance data (denormalized from template)
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").$type<TaskCategory>().notNull(),

    // Scheduling
    dueDate: text("due_date").notNull(), // ISO date
    dueTime: text("due_time"), // HH:MM

    // Status
    status: text("status").$type<TaskStatus>().notNull().default("pending"),
    priority: text("priority").$type<TaskPriority>(),

    // Context (stored as JSON)
    context: text("context", { mode: "json" }).$type<TaskContext>(),

    // Execution tracking
    startedDate: text("started_date"),
    completedDate: text("completed_date"),
    actualMinutes: integer("actual_minutes"),

    // Results
    outcome: text("outcome").$type<TaskOutcome>(),
    results: text("results"),
    issues: text("issues"),
    photos: text("photos", { mode: "json" }).$type<string[]>(),

    // Recurrence tracking
    recurrenceIndex: integer("recurrence_index"),
    nextInstanceDate: text("next_instance_date"),

    // Metadata
    metadata: text("metadata", { mode: "json" }).$type<{
      dateCreated?: string;
      lastModified?: string;
      createdFromTemplate?: boolean;
      generatedBy?: "manual" | "template" | "event-trigger";
    }>(),
  },
  (table) => ({
    statusIdx: index("instance_status_idx").on(table.status),
    dueDateIdx: index("instance_due_date_idx").on(table.dueDate),
    templateIdx: index("instance_template_idx").on(table.templateId),
    categoryIdx: index("instance_category_idx").on(table.category),
  })
);

/**
 * Task template tags junction table
 * Many-to-many relationship for template tags
 */
export const taskTemplateTags = sqliteTable(
  "task_template_tags",
  {
    templateId: text("template_id")
      .notNull()
      .references(() => taskTemplates.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.templateId, table.tag] }),
    tagIdx: index("task_tag_idx").on(table.tag),
  })
);

/**
 * Task dependencies table
 * Tracks dependencies between task templates
 */
export const taskDependencies = sqliteTable(
  "task_dependencies",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => taskTemplates.id, { onDelete: "cascade" }),
    dependsOnTaskId: text("depends_on_task_id")
      .notNull()
      .references(() => taskTemplates.id, { onDelete: "cascade" }),
    dependencyType: text("dependency_type").$type<DependencyType>().notNull(),
    notes: text("notes"),
  },
  (table) => ({
    taskIdx: index("dep_task_idx").on(table.taskId),
    dependsOnIdx: index("dep_depends_on_idx").on(table.dependsOnTaskId),
  })
);

/**
 * Task instance dependencies table
 * Tracks dependencies between specific task instances
 */
export const taskInstanceDependencies = sqliteTable(
  "task_instance_dependencies",
  {
    id: text("id").primaryKey(),
    instanceId: text("instance_id")
      .notNull()
      .references(() => taskInstances.id, { onDelete: "cascade" }),
    dependsOnInstanceId: text("depends_on_instance_id")
      .notNull()
      .references(() => taskInstances.id, { onDelete: "cascade" }),
    dependencyType: text("dependency_type").$type<DependencyType>().notNull(),
  },
  (table) => ({
    instanceIdx: index("inst_dep_instance_idx").on(table.instanceId),
    dependsOnIdx: index("inst_dep_depends_on_idx").on(table.dependsOnInstanceId),
  })
);
