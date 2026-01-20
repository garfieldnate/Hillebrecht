/**
 * Task instance generation logic
 * Generates specific task instances from templates based on recurrence patterns
 */

import type {
  TaskTemplate,
  TaskInstance,
  CalendarRecurrence,
  SeasonalRecurrence,
  FrostRelativeRecurrence,
  EventTriggeredRecurrence,
} from "../types/task.types.ts";
import { Season } from "../types/common.types.ts";

/**
 * Context for generating instances
 */
interface GenerationContext {
  frostDates?: {
    lastSpringFrost: Date;
    firstFallFrost: Date;
  };
  plantingDate?: Date;
  harvestDate?: Date;
}

/**
 * Generate instances based on recurrence pattern
 */
export function generateInstancesFromRecurrence(
  template: TaskTemplate,
  startDate: Date,
  endDate: Date,
  context: GenerationContext
): TaskInstance[] {
  switch (template.recurrence.type) {
    case "calendar":
      return generateCalendarInstances(template, startDate, endDate);
    case "seasonal":
      return generateSeasonalInstances(template, startDate, endDate);
    case "frost-relative":
      return generateFrostRelativeInstances(template, startDate, endDate, context.frostDates);
    case "event-triggered":
      return generateEventTriggeredInstances(template, context);
    case "one-time":
      return generateOneTimeInstance(template);
    default:
      return [];
  }
}

/**
 * Generate calendar-based instances
 */
function generateCalendarInstances(
  template: TaskTemplate,
  rangeStart: Date,
  rangeEnd: Date
): TaskInstance[] {
  const recurrence = template.recurrence as CalendarRecurrence;
  const instances: TaskInstance[] = [];

  const startDate = new Date(recurrence.startDate);
  const endDate = recurrence.endDate ? new Date(recurrence.endDate) : rangeEnd;

  let currentDate = new Date(Math.max(startDate.getTime(), rangeStart.getTime()));
  let index = 1;

  while (currentDate <= endDate && currentDate <= rangeEnd) {
    // Check if this date matches the recurrence pattern
    if (matchesCalendarPattern(currentDate, recurrence)) {
      const instance = createInstanceFromTemplate(
        template,
        currentDate.toISOString().split("T")[0],
        index
      );
      instances.push(instance);
      index++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances;
}

/**
 * Check if a date matches the calendar recurrence pattern
 */
function matchesCalendarPattern(date: Date, recurrence: CalendarRecurrence): boolean {
  const startDate = new Date(recurrence.startDate);

  if (recurrence.intervalType === "daily") {
    const daysDiff = Math.floor(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff >= 0 && daysDiff % recurrence.intervalCount === 0;
  }

  if (recurrence.intervalType === "weekly") {
    // Check if day of week matches
    if (recurrence.daysOfWeek && !recurrence.daysOfWeek.includes(date.getDay())) {
      return false;
    }

    const weeksDiff = Math.floor(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    return weeksDiff >= 0 && weeksDiff % recurrence.intervalCount === 0;
  }

  if (recurrence.intervalType === "monthly") {
    // Check if day of month matches
    if (recurrence.dayOfMonth && date.getDate() !== recurrence.dayOfMonth) {
      return false;
    }

    const monthsDiff =
      (date.getFullYear() - startDate.getFullYear()) * 12 +
      (date.getMonth() - startDate.getMonth());
    return monthsDiff >= 0 && monthsDiff % recurrence.intervalCount === 0;
  }

  return false;
}

/**
 * Generate seasonal instances
 */
function generateSeasonalInstances(
  template: TaskTemplate,
  rangeStart: Date,
  rangeEnd: Date
): TaskInstance[] {
  const recurrence = template.recurrence as SeasonalRecurrence;
  const instances: TaskInstance[] = [];
  let index = 1;

  // For each year in the range
  const startYear = rangeStart.getFullYear();
  const endYear = rangeEnd.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    // For each season specified
    for (const season of recurrence.seasons) {
      const seasonDates = getSeasonDates(year, season);
      let currentDate = new Date(seasonDates.start);

      // Apply offset from season start if specified
      if (recurrence.weeksFromSeasonStart) {
        currentDate.setDate(currentDate.getDate() + recurrence.weeksFromSeasonStart * 7);
      }

      // Calculate end date (either season end or weeks before season end)
      const seasonEnd = recurrence.weeksBeforeSeasonEnd
        ? new Date(
            seasonDates.end.getTime() - recurrence.weeksBeforeSeasonEnd * 7 * 24 * 60 * 60 * 1000
          )
        : seasonDates.end;

      // Generate instances at the specified interval
      while (currentDate <= seasonEnd) {
        if (currentDate >= rangeStart && currentDate <= rangeEnd) {
          const instance = createInstanceFromTemplate(
            template,
            currentDate.toISOString().split("T")[0],
            index
          );
          instances.push(instance);
          index++;
        }

        // Move to next occurrence
        currentDate.setDate(currentDate.getDate() + recurrence.weekInterval * 7);
      }
    }
  }

  return instances;
}

/**
 * Get season date ranges for a given year
 */
function getSeasonDates(year: number, season: Season): { start: Date; end: Date } {
  switch (season) {
    case Season.Spring:
      return {
        start: new Date(year, 2, 20), // March 20
        end: new Date(year, 5, 20), // June 20
      };
    case Season.Summer:
      return {
        start: new Date(year, 5, 21), // June 21
        end: new Date(year, 8, 21), // September 21
      };
    case Season.Fall:
      return {
        start: new Date(year, 8, 22), // September 22
        end: new Date(year, 11, 20), // December 20
      };
    case Season.Winter:
      return {
        start: new Date(year, 11, 21), // December 21
        end: new Date(year + 1, 2, 19), // March 19 next year
      };
  }
}

/**
 * Generate frost-relative instances
 */
function generateFrostRelativeInstances(
  template: TaskTemplate,
  rangeStart: Date,
  rangeEnd: Date,
  frostDates?: { lastSpringFrost: Date; firstFallFrost: Date }
): TaskInstance[] {
  if (!frostDates) {
    console.warn("Frost dates not provided for frost-relative task");
    return [];
  }

  const recurrence = template.recurrence as FrostRelativeRecurrence;
  const instances: TaskInstance[] = [];

  // Calculate the trigger date based on frost timing
  const frostDate =
    recurrence.frostTiming.frostReference === "last-spring-frost"
      ? frostDates.lastSpringFrost
      : frostDates.firstFallFrost;

  const triggerDate = new Date(frostDate);
  triggerDate.setDate(triggerDate.getDate() + recurrence.frostTiming.weeksFromFrost * 7);

  // Check if trigger date is in range
  if (triggerDate < rangeStart || triggerDate > rangeEnd) {
    return instances;
  }

  // Create first instance
  let index = 1;
  instances.push(
    createInstanceFromTemplate(template, triggerDate.toISOString().split("T")[0], index)
  );

  // Generate repeated instances if specified
  if (recurrence.repeatWeeks && recurrence.repeatCount) {
    for (let i = 1; i < recurrence.repeatCount; i++) {
      const repeatDate = new Date(triggerDate);
      repeatDate.setDate(repeatDate.getDate() + i * recurrence.repeatWeeks * 7);

      if (repeatDate > rangeEnd) {
        break;
      }

      index++;
      instances.push(
        createInstanceFromTemplate(template, repeatDate.toISOString().split("T")[0], index)
      );
    }
  }

  return instances;
}

/**
 * Generate event-triggered instances
 */
function generateEventTriggeredInstances(
  template: TaskTemplate,
  context: GenerationContext
): TaskInstance[] {
  const recurrence = template.recurrence as EventTriggeredRecurrence;
  const instances: TaskInstance[] = [];

  // Determine the event date based on trigger event
  let eventDate: Date | undefined;
  if (recurrence.triggerEvent === "planting" && context.plantingDate) {
    eventDate = context.plantingDate;
  } else if (recurrence.triggerEvent === "harvest" && context.harvestDate) {
    eventDate = context.harvestDate;
  }

  if (!eventDate) {
    return instances;
  }

  // Calculate trigger date
  const triggerDate = new Date(eventDate);
  triggerDate.setDate(triggerDate.getDate() + recurrence.weeksAfterEvent * 7);

  // Create first instance
  let index = 1;
  instances.push(
    createInstanceFromTemplate(template, triggerDate.toISOString().split("T")[0], index)
  );

  // Generate repeated instances if specified
  if (recurrence.repeatWeeks && recurrence.repeatCount) {
    for (let i = 1; i < recurrence.repeatCount; i++) {
      const repeatDate = new Date(triggerDate);
      repeatDate.setDate(repeatDate.getDate() + i * recurrence.repeatWeeks * 7);

      index++;
      instances.push(
        createInstanceFromTemplate(template, repeatDate.toISOString().split("T")[0], index)
      );
    }
  }

  return instances;
}

/**
 * Generate one-time instance
 */
function generateOneTimeInstance(template: TaskTemplate): TaskInstance[] {
  const recurrence = template.recurrence as { type: "one-time"; date: string };
  return [createInstanceFromTemplate(template, recurrence.date, 1)];
}

/**
 * Create a task instance from a template
 */
function createInstanceFromTemplate(
  template: TaskTemplate,
  dueDate: string,
  recurrenceIndex: number
): TaskInstance {
  const now = new Date().toISOString();

  return {
    id: `${template.id}-${dueDate}-${recurrenceIndex}`,
    templateId: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    dueDate,
    status: "pending",
    priority: template.priority,
    recurrenceIndex,
    metadata: {
      dateCreated: now,
      createdFromTemplate: true,
      generatedBy: "template",
    },
  };
}

/**
 * Helper to add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Helper to add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}
