/**
 * Simplified Tasks API - LLM-Friendly
 *
 * Makes it easy to add garden tasks to the database.
 * Tasks have two levels:
 * - TaskTemplate: Recurring patterns (e.g., "Water tomatoes every week")
 * - TaskInstance: Specific occurrences (e.g., "Water tomatoes on June 15")
 */

import { db } from "../db/client.node.ts";
import { taskTemplates, taskInstances } from "../db/schema/index.ts";
import { eq } from "drizzle-orm";
import type { TaskTemplate, TaskInstance } from "../types/task.types.ts";
import { Season } from "../types/common.types.ts";

/**
 * Simplified task template data
 * Only category and name are required
 */
export interface SimpleTaskTemplateData {
  // REQUIRED
  name: string;
  category: "maintenance" | "planting" | "harvest" | "pruning" | "pest-management" | "fertilization" | "watering" | "general";

  // OPTIONAL - Description and instructions
  description?: string;
  instructions?: string;
  estimatedMinutes?: number;
  supplies?: string[];
  priority?: "low" | "medium" | "high" | "critical";

  // OPTIONAL - Recurrence (defaults to one-time)
  recurrence?: {
    type: "calendar" | "seasonal" | "frost-relative" | "event-triggered" | "one-time";

    // For calendar: specify interval
    intervalType?: "daily" | "weekly" | "monthly";
    intervalCount?: number;
    startDate?: string; // ISO date
    endDate?: string;
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc.

    // For seasonal: specify seasons
    seasons?: ("spring" | "summer" | "fall" | "winter")[];
    weekInterval?: number;

    // For frost-relative: specify timing
    weeksFromFrost?: number;
    frostReference?: "last-spring-frost" | "first-fall-frost";

    // For event-triggered: specify event
    triggerEvent?: "planting" | "transplant" | "harvest" | "task-completion";
    weeksAfterEvent?: number;

    // For one-time: specify date
    date?: string;
  };

  // OPTIONAL - What this task applies to
  appliesTo?: {
    plantIds?: string[];
    plantTags?: string[];
    beds?: string[];
  };

  // OPTIONAL - Tags and notes
  tags?: string[];
  notes?: string;
}

/**
 * Simplified task instance data
 * Just the essentials for a specific task occurrence
 */
export interface SimpleTaskInstanceData {
  // REQUIRED
  name: string;
  dueDate: string; // ISO date (YYYY-MM-DD)
  category: "maintenance" | "planting" | "harvest" | "pruning" | "pest-management" | "fertilization" | "watering" | "general";

  // OPTIONAL
  description?: string;
  dueTime?: string; // HH:MM format
  priority?: "low" | "medium" | "high" | "critical";
  status?: "pending" | "in-progress" | "completed" | "skipped" | "cancelled";

  // OPTIONAL - Context
  plantingId?: string;
  plantId?: string;
  bedId?: string;
  locationNotes?: string;

  // OPTIONAL - For completed tasks
  outcome?: "successful" | "partially-successful" | "unsuccessful" | "not-applicable";
  results?: string;
  actualMinutes?: number;
}

/**
 * Add a task template with minimal data
 *
 * @example
 * // Simple weekly watering task
 * await addTaskTemplateSimple({
 *   name: "Water Tomatoes",
 *   category: "watering",
 *   recurrence: {
 *     type: "calendar",
 *     intervalType: "weekly",
 *     intervalCount: 1,
 *     startDate: "2026-06-01",
 *     endDate: "2026-09-30"
 *   }
 * });
 *
 * @example
 * // One-time task (default)
 * await addTaskTemplateSimple({
 *   name: "Spring Garden Cleanup",
 *   category: "maintenance",
 *   recurrence: {
 *     type: "one-time",
 *     date: "2026-04-01"
 *   }
 * });
 */
export async function addTaskTemplateSimple(data: SimpleTaskTemplateData): Promise<string> {
  const id = generateTaskId(data.name);

  // Check if template already exists
  const existing = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id)).limit(1);
  if (existing.length > 0) {
    throw new Error(`Task template already exists: ${data.name}`);
  }

  // Build recurrence pattern with defaults
  const recurrence = buildRecurrencePattern(data.recurrence);

  // Insert template
  await db.insert(taskTemplates).values({
    id,
    name: data.name,
    description: data.description || null,
    category: data.category,
    recurrence,
    appliesTo: data.appliesTo || null,
    instructions: data.instructions || null,
    estimatedMinutes: data.estimatedMinutes || null,
    supplies: data.supplies || null,
    priority: data.priority || null,
    isActive: true,
    notes: data.notes || null,
    metadata: {
      dateCreated: new Date().toISOString(),
    },
  });

  return id;
}

/**
 * Add a task instance (specific occurrence)
 *
 * @example
 * // Add a one-time task
 * await addTaskInstanceSimple({
 *   name: "Harvest Tomatoes",
 *   dueDate: "2026-07-15",
 *   category: "harvest",
 *   plantId: "tomato-cherokee-purple"
 * });
 *
 * @example
 * // Add with completion info
 * await addTaskInstanceSimple({
 *   name: "Fertilize Garden Bed A",
 *   dueDate: "2026-06-01",
 *   category: "fertilization",
 *   status: "completed",
 *   outcome: "successful",
 *   results: "Applied fish emulsion to all plants"
 * });
 */
export async function addTaskInstanceSimple(data: SimpleTaskInstanceData): Promise<string> {
  const id = generateTaskInstanceId(data.name, data.dueDate);

  // Check if instance already exists
  const existing = await db.select().from(taskInstances).where(eq(taskInstances.id, id)).limit(1);
  if (existing.length > 0) {
    throw new Error(`Task instance already exists: ${data.name} on ${data.dueDate}`);
  }

  const now = new Date().toISOString();

  // Build context object
  const context = (data.plantingId || data.plantId || data.bedId || data.locationNotes) ? {
    plantingId: data.plantingId,
    plantId: data.plantId,
    bedId: data.bedId,
    locationNotes: data.locationNotes,
  } : null;

  // Insert instance
  await db.insert(taskInstances).values({
    id,
    templateId: null, // Manual instance, not from template
    name: data.name,
    description: data.description || null,
    category: data.category,
    dueDate: data.dueDate,
    dueTime: data.dueTime || null,
    status: data.status || "pending",
    priority: data.priority || null,
    context,
    startedDate: null,
    completedDate: data.status === "completed" ? now : null,
    actualMinutes: data.actualMinutes || null,
    outcome: data.outcome || null,
    results: data.results || null,
    issues: null,
    photos: null,
    recurrenceIndex: null,
    nextInstanceDate: null,
    metadata: {
      dateCreated: now,
      generatedBy: "manual",
    },
  });

  return id;
}

/**
 * Update task instance status
 *
 * @example
 * await updateTaskStatus("water-tomatoes-2026-06-15", "completed", {
 *   outcome: "successful",
 *   results: "All plants watered thoroughly",
 *   actualMinutes: 15
 * });
 */
export async function updateTaskStatus(
  instanceId: string,
  status: "pending" | "in-progress" | "completed" | "skipped" | "cancelled",
  details?: {
    outcome?: "successful" | "partially-successful" | "unsuccessful" | "not-applicable";
    results?: string;
    actualMinutes?: number;
  }
): Promise<void> {
  const now = new Date().toISOString();

  await db.update(taskInstances)
    .set({
      status,
      completedDate: status === "completed" ? now : null,
      outcome: details?.outcome || null,
      results: details?.results || null,
      actualMinutes: details?.actualMinutes || null,
    })
    .where(eq(taskInstances.id, instanceId));
}

/**
 * Generate task template ID from name
 */
function generateTaskId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate task instance ID from name and date
 */
function generateTaskInstanceId(name: string, date: string): string {
  const taskPart = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${taskPart}-${date}`;
}

/**
 * Build recurrence pattern with defaults
 */
function buildRecurrencePattern(data?: SimpleTaskTemplateData['recurrence']) {
  if (!data || !data.type) {
    // Default to one-time task today
    return {
      type: "one-time" as const,
      date: new Date().toISOString().split('T')[0],
    };
  }

  if (data.type === "calendar") {
    return {
      type: "calendar" as const,
      intervalType: data.intervalType || "weekly",
      intervalCount: data.intervalCount || 1,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate,
      daysOfWeek: data.daysOfWeek,
    };
  }

  if (data.type === "seasonal") {
    return {
      type: "seasonal" as const,
      seasons: (data.seasons?.map(s =>
        s === "spring" ? Season.Spring :
        s === "summer" ? Season.Summer :
        s === "fall" ? Season.Fall :
        Season.Winter
      )) || [Season.Summer],
      weekInterval: data.weekInterval || 1,
    };
  }

  if (data.type === "frost-relative") {
    return {
      type: "frost-relative" as const,
      frostTiming: {
        weeksFromFrost: data.weeksFromFrost || 0,
        frostReference: data.frostReference || "last-spring-frost",
      },
    };
  }

  if (data.type === "event-triggered") {
    return {
      type: "event-triggered" as const,
      triggerEvent: data.triggerEvent || "planting",
      weeksAfterEvent: data.weeksAfterEvent || 0,
    };
  }

  // one-time
  return {
    type: "one-time" as const,
    date: data.date || new Date().toISOString().split('T')[0],
  };
}
