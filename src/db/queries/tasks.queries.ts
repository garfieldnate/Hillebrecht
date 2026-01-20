/**
 * Task query functions
 * Handles CRUD operations for task templates, instances, and dependencies
 */

import { db } from "../client.node.ts";
import {
  taskTemplates,
  taskInstances,
  taskTemplateTags,
  taskDependencies,
  taskInstanceDependencies,
} from "../schema/index.ts";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";
import type {
  TaskTemplate,
  TaskInstance,
  TaskDependency,
  TaskInstanceDependency,
} from "../../types/task.types.ts";
import { generateInstancesFromRecurrence } from "../../lib/task-generator.ts";

// ============================================================================
// Task Template Queries
// ============================================================================

/**
 * Get a task template by ID
 */
export async function getTaskTemplateById(id: string): Promise<TaskTemplate | undefined> {
  const result = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.id, id))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }

  const template = result[0];

  // Get tags for this template
  const tags = await db
    .select({ tag: taskTemplateTags.tag })
    .from(taskTemplateTags)
    .where(eq(taskTemplateTags.templateId, id));

  // Reconstruct the TaskTemplate object
  return {
    id: template.id,
    name: template.name,
    description: template.description || undefined,
    category: template.category,
    tags: tags.length > 0 ? tags.map((t) => t.tag) : undefined,
    recurrence: template.recurrence,
    appliesTo: template.appliesTo || undefined,
    instructions: template.instructions || undefined,
    estimatedMinutes: template.estimatedMinutes || undefined,
    supplies: template.supplies || undefined,
    priority: template.priority || undefined,
    isActive: Boolean(template.isActive),
    createdBy: template.createdBy || undefined,
    notes: template.notes || undefined,
    metadata: template.metadata || undefined,
  };
}

/**
 * Get all active task templates
 */
export async function getActiveTaskTemplates(): Promise<TaskTemplate[]> {
  const results = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.isActive, true));

  const fullTemplates: TaskTemplate[] = [];
  for (const result of results) {
    const template = await getTaskTemplateById(result.id);
    if (template) {
      fullTemplates.push(template);
    }
  }

  return fullTemplates;
}

/**
 * Get templates by category
 */
export async function getTaskTemplatesByCategory(category: string): Promise<TaskTemplate[]> {
  const results = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.category, category as any));

  const fullTemplates: TaskTemplate[] = [];
  for (const result of results) {
    const template = await getTaskTemplateById(result.id);
    if (template) {
      fullTemplates.push(template);
    }
  }

  return fullTemplates;
}

/**
 * Get templates by tag
 */
export async function getTaskTemplatesByTag(tag: string): Promise<TaskTemplate[]> {
  const templateIds = await db
    .select({ templateId: taskTemplateTags.templateId })
    .from(taskTemplateTags)
    .where(eq(taskTemplateTags.tag, tag));

  const fullTemplates: TaskTemplate[] = [];
  for (const { templateId } of templateIds) {
    const template = await getTaskTemplateById(templateId);
    if (template) {
      fullTemplates.push(template);
    }
  }

  return fullTemplates;
}

/**
 * Get templates applicable to a specific plant
 */
export async function getTaskTemplatesForPlant(plantId: string): Promise<TaskTemplate[]> {
  const results = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.isActive, true));

  const applicableTemplates: TaskTemplate[] = [];

  for (const result of results) {
    const template = await getTaskTemplateById(result.id);
    if (!template) continue;

    // Check if template applies to this plant
    if (template.appliesTo?.plantIds?.includes(plantId)) {
      applicableTemplates.push(template);
    }
  }

  return applicableTemplates;
}

/**
 * Add new task template
 */
export async function addTaskTemplate(template: TaskTemplate): Promise<void> {
  // Insert the template
  await db.insert(taskTemplates).values({
    id: template.id,
    name: template.name,
    description: template.description || null,
    category: template.category,
    recurrence: template.recurrence,
    appliesTo: template.appliesTo || null,
    instructions: template.instructions || null,
    estimatedMinutes: template.estimatedMinutes || null,
    supplies: template.supplies || null,
    priority: template.priority || null,
    isActive: template.isActive,
    createdBy: template.createdBy || null,
    notes: template.notes || null,
    metadata: template.metadata || null,
  });

  // Insert tags if present
  if (template.tags && template.tags.length > 0) {
    await db.insert(taskTemplateTags).values(
      template.tags.map((tag) => ({
        templateId: template.id,
        tag,
      }))
    );
  }
}

/**
 * Update task template
 */
export async function updateTaskTemplate(
  id: string,
  updates: Partial<TaskTemplate>
): Promise<TaskTemplate | undefined> {
  // Update the template
  await db
    .update(taskTemplates)
    .set({
      name: updates.name,
      description: updates.description,
      category: updates.category,
      recurrence: updates.recurrence,
      appliesTo: updates.appliesTo,
      instructions: updates.instructions,
      estimatedMinutes: updates.estimatedMinutes,
      supplies: updates.supplies,
      priority: updates.priority,
      isActive: updates.isActive,
      notes: updates.notes,
      metadata: updates.metadata,
    })
    .where(eq(taskTemplates.id, id));

  // Update tags if provided
  if (updates.tags) {
    // Delete existing tags
    await db.delete(taskTemplateTags).where(eq(taskTemplateTags.templateId, id));

    // Insert new tags
    if (updates.tags.length > 0) {
      await db.insert(taskTemplateTags).values(
        updates.tags.map((tag) => ({
          templateId: id,
          tag,
        }))
      );
    }
  }

  return getTaskTemplateById(id);
}

/**
 * Delete task template
 */
export async function deleteTaskTemplate(id: string): Promise<boolean> {
  const existing = await getTaskTemplateById(id);
  if (!existing) {
    return false;
  }

  await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
  return true;
}

// ============================================================================
// Task Instance Queries
// ============================================================================

/**
 * Get task instance by ID
 */
export async function getTaskInstanceById(id: string): Promise<TaskInstance | undefined> {
  const result = await db
    .select()
    .from(taskInstances)
    .where(eq(taskInstances.id, id))
    .limit(1);

  if (result.length === 0) {
    return undefined;
  }

  const instance = result[0];

  // Get dependencies
  const deps = await db
    .select({ dependsOnInstanceId: taskInstanceDependencies.dependsOnInstanceId })
    .from(taskInstanceDependencies)
    .where(eq(taskInstanceDependencies.instanceId, id));

  return {
    id: instance.id,
    templateId: instance.templateId || undefined,
    name: instance.name,
    description: instance.description || undefined,
    category: instance.category,
    dueDate: instance.dueDate,
    dueTime: instance.dueTime || undefined,
    status: instance.status,
    priority: instance.priority || undefined,
    context: instance.context || undefined,
    startedDate: instance.startedDate || undefined,
    completedDate: instance.completedDate || undefined,
    actualMinutes: instance.actualMinutes || undefined,
    outcome: instance.outcome || undefined,
    results: instance.results || undefined,
    issues: instance.issues || undefined,
    photos: instance.photos || undefined,
    dependsOnInstances: deps.length > 0 ? deps.map((d) => d.dependsOnInstanceId) : undefined,
    recurrenceIndex: instance.recurrenceIndex || undefined,
    nextInstanceDate: instance.nextInstanceDate || undefined,
    metadata: instance.metadata || undefined,
  };
}

/**
 * Get instances by status
 */
export async function getTaskInstancesByStatus(status: string): Promise<TaskInstance[]> {
  const results = await db
    .select()
    .from(taskInstances)
    .where(eq(taskInstances.status, status as any));

  const fullInstances: TaskInstance[] = [];
  for (const result of results) {
    const instance = await getTaskInstanceById(result.id);
    if (instance) {
      fullInstances.push(instance);
    }
  }

  return fullInstances;
}

/**
 * Get instances due within date range
 */
export async function getTaskInstancesByDateRange(
  startDate: string,
  endDate: string
): Promise<TaskInstance[]> {
  const results = await db
    .select()
    .from(taskInstances)
    .where(and(gte(taskInstances.dueDate, startDate), lte(taskInstances.dueDate, endDate)))
    .orderBy(taskInstances.dueDate);

  const fullInstances: TaskInstance[] = [];
  for (const result of results) {
    const instance = await getTaskInstanceById(result.id);
    if (instance) {
      fullInstances.push(instance);
    }
  }

  return fullInstances;
}

/**
 * Get overdue instances
 */
export async function getOverdueTaskInstances(): Promise<TaskInstance[]> {
  const today = new Date().toISOString().split("T")[0];

  const results = await db
    .select()
    .from(taskInstances)
    .where(
      and(
        lte(taskInstances.dueDate, today),
        inArray(taskInstances.status, ["pending", "in-progress"])
      )
    )
    .orderBy(taskInstances.dueDate);

  const fullInstances: TaskInstance[] = [];
  for (const result of results) {
    const instance = await getTaskInstanceById(result.id);
    if (instance) {
      fullInstances.push(instance);
    }
  }

  return fullInstances;
}

/**
 * Get instances for a specific planting
 */
export async function getTaskInstancesForPlanting(plantingId: string): Promise<TaskInstance[]> {
  const results = await db
    .select()
    .from(taskInstances)
    .where(sql`json_extract(${taskInstances.context}, '$.plantingId') = ${plantingId}`)
    .orderBy(taskInstances.dueDate);

  const fullInstances: TaskInstance[] = [];
  for (const result of results) {
    const instance = await getTaskInstanceById(result.id);
    if (instance) {
      fullInstances.push(instance);
    }
  }

  return fullInstances;
}

/**
 * Add task instance
 */
export async function addTaskInstance(instance: TaskInstance): Promise<void> {
  // Check if instance already exists
  const existing = await getTaskInstanceById(instance.id);
  if (existing) {
    return; // Skip if already exists
  }

  await db.insert(taskInstances).values({
    id: instance.id,
    templateId: instance.templateId || null,
    name: instance.name,
    description: instance.description || null,
    category: instance.category,
    dueDate: instance.dueDate,
    dueTime: instance.dueTime || null,
    status: instance.status,
    priority: instance.priority || null,
    context: instance.context || null,
    startedDate: instance.startedDate || null,
    completedDate: instance.completedDate || null,
    actualMinutes: instance.actualMinutes || null,
    outcome: instance.outcome || null,
    results: instance.results || null,
    issues: instance.issues || null,
    photos: instance.photos || null,
    recurrenceIndex: instance.recurrenceIndex || null,
    nextInstanceDate: instance.nextInstanceDate || null,
    metadata: instance.metadata || null,
  });

  // Insert dependencies if present
  if (instance.dependsOnInstances && instance.dependsOnInstances.length > 0) {
    await db.insert(taskInstanceDependencies).values(
      instance.dependsOnInstances.map((depId) => ({
        id: `${instance.id}-depends-on-${depId}`,
        instanceId: instance.id,
        dependsOnInstanceId: depId,
        dependencyType: "required" as any,
      }))
    );
  }
}

/**
 * Update task instance
 */
export async function updateTaskInstance(
  id: string,
  updates: Partial<TaskInstance>
): Promise<TaskInstance | undefined> {
  await db
    .update(taskInstances)
    .set({
      name: updates.name,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      dueDate: updates.dueDate,
      dueTime: updates.dueTime,
      context: updates.context,
      startedDate: updates.startedDate,
      completedDate: updates.completedDate,
      actualMinutes: updates.actualMinutes,
      outcome: updates.outcome,
      results: updates.results,
      issues: updates.issues,
      photos: updates.photos,
      metadata: updates.metadata,
    })
    .where(eq(taskInstances.id, id));

  return getTaskInstanceById(id);
}

/**
 * Complete task instance
 */
export async function completeTaskInstance(
  id: string,
  outcome: string,
  results?: string
): Promise<TaskInstance | undefined> {
  const now = new Date().toISOString();

  await db
    .update(taskInstances)
    .set({
      status: "completed",
      completedDate: now,
      outcome: outcome as any,
      results: results || null,
    })
    .where(eq(taskInstances.id, id));

  return getTaskInstanceById(id);
}

/**
 * Delete task instance
 */
export async function deleteTaskInstance(id: string): Promise<boolean> {
  const existing = await getTaskInstanceById(id);
  if (!existing) {
    return false;
  }

  await db.delete(taskInstances).where(eq(taskInstances.id, id));
  return true;
}

// ============================================================================
// Dependency Queries
// ============================================================================

/**
 * Get dependencies for a task template
 */
export async function getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
  const results = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.taskId, taskId));

  return results.map((r) => ({
    id: r.id,
    taskId: r.taskId,
    dependsOnTaskId: r.dependsOnTaskId,
    dependencyType: r.dependencyType,
    notes: r.notes || undefined,
  }));
}

/**
 * Get dependencies for a task instance
 */
export async function getTaskInstanceDependencies(instanceId: string): Promise<string[]> {
  const results = await db
    .select({ dependsOnInstanceId: taskInstanceDependencies.dependsOnInstanceId })
    .from(taskInstanceDependencies)
    .where(eq(taskInstanceDependencies.instanceId, instanceId));

  return results.map((r) => r.dependsOnInstanceId);
}

/**
 * Check if task instance is blocked
 */
export async function isTaskInstanceBlocked(instanceId: string): Promise<boolean> {
  const dependencies = await db
    .select({ dependsOnInstanceId: taskInstanceDependencies.dependsOnInstanceId })
    .from(taskInstanceDependencies)
    .where(eq(taskInstanceDependencies.instanceId, instanceId));

  if (dependencies.length === 0) {
    return false;
  }

  // Check if any dependency is not completed
  for (const dep of dependencies) {
    const depInstance = await getTaskInstanceById(dep.dependsOnInstanceId);
    if (depInstance && depInstance.status !== "completed") {
      return true;
    }
  }

  return false;
}

/**
 * Add dependency between templates
 */
export async function addTaskDependency(dependency: TaskDependency): Promise<void> {
  await db.insert(taskDependencies).values({
    id: dependency.id,
    taskId: dependency.taskId,
    dependsOnTaskId: dependency.dependsOnTaskId,
    dependencyType: dependency.dependencyType,
    notes: dependency.notes || null,
  });
}

/**
 * Add dependency between instances
 */
export async function addTaskInstanceDependency(
  instanceId: string,
  dependsOnInstanceId: string,
  dependencyType: "required" | "suggested" | "blocked-by"
): Promise<void> {
  await db.insert(taskInstanceDependencies).values({
    id: `${instanceId}-depends-on-${dependsOnInstanceId}`,
    instanceId,
    dependsOnInstanceId,
    dependencyType,
  });
}

// ============================================================================
// Instance Generation Functions
// ============================================================================

/**
 * Generate task instances from template for a date range
 */
export async function generateInstancesFromTemplate(
  templateId: string,
  startDate: string,
  endDate: string,
  frostDates?: { lastSpringFrost: string; firstFallFrost: string }
): Promise<TaskInstance[]> {
  const template = await getTaskTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const context = {
    frostDates: frostDates
      ? {
          lastSpringFrost: new Date(frostDates.lastSpringFrost),
          firstFallFrost: new Date(frostDates.firstFallFrost),
        }
      : undefined,
  };

  const instances = generateInstancesFromRecurrence(template, start, end, context);

  // Save instances to database
  for (const instance of instances) {
    await addTaskInstance(instance);
  }

  return instances;
}

/**
 * Generate instances for all active templates
 */
export async function generateInstancesForAllTemplates(
  startDate: string,
  endDate: string,
  frostDates?: { lastSpringFrost: string; firstFallFrost: string }
): Promise<TaskInstance[]> {
  const templates = await getActiveTaskTemplates();
  const allInstances: TaskInstance[] = [];

  for (const template of templates) {
    const instances = await generateInstancesFromTemplate(
      template.id,
      startDate,
      endDate,
      frostDates
    );
    allInstances.push(...instances);
  }

  return allInstances;
}

/**
 * Generate event-triggered instances
 */
export async function generateEventTriggeredInstances(
  eventType: "planting" | "transplant" | "harvest" | "task-completion",
  contextId: string,
  eventDate: string
): Promise<TaskInstance[]> {
  const templates = await getActiveTaskTemplates();
  const triggeredInstances: TaskInstance[] = [];

  for (const template of templates) {
    if (
      template.recurrence.type === "event-triggered" &&
      template.recurrence.triggerEvent === eventType
    ) {
      const eventDateObj = new Date(eventDate);
      const context = {
        plantingDate: eventType === "planting" ? eventDateObj : undefined,
        harvestDate: eventType === "harvest" ? eventDateObj : undefined,
      };

      const instances = generateInstancesFromRecurrence(
        template,
        eventDateObj,
        new Date(eventDateObj.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year window
        context
      );

      // Add context ID to instances
      for (const instance of instances) {
        if (eventType === "planting" || eventType === "transplant") {
          instance.context = {
            ...instance.context,
            plantingId: contextId,
          };
        }

        await addTaskInstance(instance);
        triggeredInstances.push(instance);
      }
    }
  }

  return triggeredInstances;
}
