/**
 * Task management type definitions for garden activity scheduling and tracking
 */

import type { Season, FrostRelativeTiming } from "./common.types.ts";

/**
 * Calendar-based recurrence (fixed schedule)
 */
export interface CalendarRecurrence {
  type: "calendar";
  intervalType: "daily" | "weekly" | "monthly";
  intervalCount: number; // Every N days/weeks/months
  startDate: string; // ISO date
  endDate?: string; // Optional end date
  daysOfWeek?: number[]; // For weekly: [0=Sun, 1=Mon, ...]
  dayOfMonth?: number; // For monthly: 1-31
}

/**
 * Seasonal recurrence (within specific seasons)
 */
export interface SeasonalRecurrence {
  type: "seasonal";
  seasons: Season[]; // Which seasons to run in
  weekInterval: number; // Every N weeks during season
  weeksFromSeasonStart?: number; // Optional: start N weeks into season
  weeksBeforeSeasonEnd?: number; // Optional: stop N weeks before season end
}

/**
 * Frost-relative recurrence (based on frost dates)
 */
export interface FrostRelativeRecurrence {
  type: "frost-relative";
  frostTiming: FrostRelativeTiming; // Reuse existing type
  repeatWeeks?: number; // Optional: repeat every N weeks after trigger
  repeatCount?: number; // How many times to repeat
}

/**
 * Event-triggered recurrence (after specific events)
 */
export interface EventTriggeredRecurrence {
  type: "event-triggered";
  triggerEvent: "planting" | "transplant" | "harvest" | "task-completion";
  weeksAfterEvent: number; // N weeks after the trigger event
  repeatWeeks?: number; // Optional: repeat every N weeks after first trigger
  repeatCount?: number; // How many times to repeat
  triggerTaskId?: string; // If triggerEvent is "task-completion"
}

/**
 * One-time occurrence
 */
export interface OneTimeRecurrence {
  type: "one-time";
  date: string; // ISO date
}

/**
 * Union type for all recurrence patterns
 */
export type RecurrencePattern =
  | CalendarRecurrence
  | SeasonalRecurrence
  | FrostRelativeRecurrence
  | EventTriggeredRecurrence
  | OneTimeRecurrence;

/**
 * Task categorization
 */
export type TaskCategory =
  | "maintenance"
  | "planting"
  | "harvest"
  | "pruning"
  | "pest-management"
  | "fertilization"
  | "watering"
  | "general";

/**
 * Task priority levels
 */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/**
 * Task instance status
 */
export type TaskStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "skipped"
  | "cancelled"
  | "blocked";

/**
 * Task outcome status
 */
export type TaskOutcome =
  | "successful"
  | "partially-successful"
  | "unsuccessful"
  | "not-applicable";

/**
 * Dependency relationship type
 */
export type DependencyType = "required" | "suggested" | "blocked-by";

/**
 * Targeting criteria for tasks
 */
export interface TaskAppliesTo {
  plantIds?: string[]; // Specific plant varieties (empty = all)
  plantingIds?: string[]; // Specific planting instances
  plantTags?: string[]; // Plants with these tags
  beds?: string[]; // Specific garden beds
}

/**
 * TaskTemplate - The general pattern for a recurring task
 */
export interface TaskTemplate {
  // Identity
  id: string;
  name: string;
  description?: string;

  // Categorization
  category: TaskCategory;
  tags?: string[];

  // Recurrence
  recurrence: RecurrencePattern;

  // Targeting (what this task applies to)
  appliesTo?: TaskAppliesTo;

  // Task content
  instructions?: string;
  estimatedMinutes?: number;
  supplies?: string[];
  priority?: TaskPriority;

  // Dependencies
  dependsOn?: string[]; // TaskTemplate IDs that must be completed first
  blockedBy?: string[]; // TaskTemplate IDs that block this task

  // Metadata
  isActive: boolean; // Can be disabled without deleting
  createdBy?: string;
  notes?: string;
  metadata?: {
    dateCreated?: string;
    lastModified?: string;
  };
}

/**
 * Task context - specific instance targeting
 */
export interface TaskContext {
  plantingId?: string; // Specific planting instance
  plantId?: string; // Plant variety
  bedId?: string; // Garden bed
  locationNotes?: string;
}

/**
 * TaskInstance - A specific scheduled occurrence of a task
 */
export interface TaskInstance {
  // Identity
  id: string;
  templateId?: string; // null for ad-hoc tasks not from template

  // Instance-specific overrides (denormalized from template)
  name: string;
  description?: string;
  category: TaskCategory;

  // Scheduling
  dueDate: string; // ISO date
  dueTime?: string; // Optional time (HH:MM format)

  // Status tracking
  status: TaskStatus;
  priority?: TaskPriority;

  // Context (what this specific instance applies to)
  context?: TaskContext;

  // Execution tracking
  startedDate?: string; // When work began
  completedDate?: string; // When finished
  actualMinutes?: number;

  // Results
  outcome?: TaskOutcome;
  results?: string; // Free-form notes
  issues?: string; // Problems encountered
  photos?: string[]; // Optional photo paths/URLs

  // Dependencies
  dependsOnInstances?: string[]; // TaskInstance IDs that must complete first
  blockedByInstances?: string[]; // TaskInstance IDs currently blocking

  // Recurrence tracking
  recurrenceIndex?: number; // Which occurrence in series (1, 2, 3...)
  nextInstanceDate?: string; // Next scheduled occurrence (if recurring)

  // Metadata
  metadata?: {
    dateCreated?: string;
    lastModified?: string;
    createdFromTemplate?: boolean;
    generatedBy?: "manual" | "template" | "event-trigger";
  };
}

/**
 * TaskDependency - Explicit dependency relationships between templates
 */
export interface TaskDependency {
  id: string;
  taskId: string; // The dependent task
  dependsOnTaskId: string; // The prerequisite task
  dependencyType: DependencyType;
  notes?: string;
}

/**
 * TaskInstanceDependency - Dependencies between instances
 */
export interface TaskInstanceDependency {
  id: string;
  instanceId: string; // The dependent instance
  dependsOnInstanceId: string; // The prerequisite instance
  dependencyType: DependencyType;
}
