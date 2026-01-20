/**
 * iCalendar export functionality
 * Exports task instances to .ics format for import into calendar applications
 */

import type { TaskInstance } from "../types/task.types.ts";

/**
 * Export task instances to iCalendar (.ics) format
 */
export function exportToICalendar(
  instances: TaskInstance[],
  calendarName: string = "Garden Tasks"
): string {
  const icsLines: string[] = [];

  // Calendar header
  icsLines.push("BEGIN:VCALENDAR");
  icsLines.push("VERSION:2.0");
  icsLines.push("PRODID:-//Hillebrecht Garden//Task Manager//EN");
  icsLines.push(`X-WR-CALNAME:${calendarName}`);
  icsLines.push("CALSCALE:GREGORIAN");
  icsLines.push("METHOD:PUBLISH");

  // Add each task as VEVENT
  for (const instance of instances) {
    icsLines.push("BEGIN:VEVENT");

    // Unique identifier
    icsLines.push(`UID:${instance.id}@hillebrecht-garden`);

    // Timestamp (current time)
    icsLines.push(`DTSTAMP:${formatICalDate(new Date())}`);

    // Start date/time
    const dueDateTime = instance.dueTime
      ? parseDateTimeToDate(instance.dueDate, instance.dueTime)
      : new Date(instance.dueDate + "T12:00:00"); // Default to noon if no time

    if (instance.dueTime) {
      icsLines.push(`DTSTART:${formatICalDate(dueDateTime)}`);
    } else {
      // All-day event
      icsLines.push(`DTSTART;VALUE=DATE:${formatICalDateOnly(dueDateTime)}`);
    }

    // Summary (task name)
    icsLines.push(`SUMMARY:${escapeICalText(instance.name)}`);

    // Description
    if (instance.description) {
      const descParts = [instance.description];

      // Add category
      descParts.push(`\nCategory: ${instance.category}`);

      // Add context if available
      if (instance.context?.locationNotes) {
        descParts.push(`\nLocation: ${instance.context.locationNotes}`);
      }
      if (instance.context?.plantId) {
        descParts.push(`\nPlant: ${instance.context.plantId}`);
      }
      if (instance.context?.plantingId) {
        descParts.push(`\nPlanting: ${instance.context.plantingId}`);
      }

      icsLines.push(`DESCRIPTION:${escapeICalText(descParts.join(""))}`);
    }

    // Location (garden bed if available)
    if (instance.context?.bedId) {
      icsLines.push(`LOCATION:${escapeICalText(`Garden Bed: ${instance.context.bedId}`)}`);
    }

    // Priority (iCalendar uses 1-9, where 1 is highest)
    if (instance.priority) {
      const priorityMap = { low: 9, medium: 5, high: 3, critical: 1 };
      icsLines.push(`PRIORITY:${priorityMap[instance.priority]}`);
    }

    // Categories
    icsLines.push(`CATEGORIES:${instance.category}`);

    // Status
    const statusMap: Record<string, string> = {
      pending: "CONFIRMED",
      "in-progress": "CONFIRMED",
      completed: "COMPLETED",
      cancelled: "CANCELLED",
      skipped: "CANCELLED",
      blocked: "TENTATIVE",
    };
    icsLines.push(`STATUS:${statusMap[instance.status] || "CONFIRMED"}`);

    // Completion date if completed
    if (instance.completedDate) {
      icsLines.push(`COMPLETED:${formatICalDate(new Date(instance.completedDate))}`);
      icsLines.push(`PERCENT-COMPLETE:100`);
    }

    // Estimated duration (from template or actual time)
    if (instance.actualMinutes) {
      icsLines.push(`DURATION:PT${instance.actualMinutes}M`);
    }

    // Notes in comment field
    if (instance.results) {
      icsLines.push(`COMMENT:${escapeICalText(`Results: ${instance.results}`)}`);
    }
    if (instance.issues) {
      icsLines.push(`COMMENT:${escapeICalText(`Issues: ${instance.issues}`)}`);
    }

    // Alarm/reminder for pending tasks (1 day before)
    if (instance.status === "pending") {
      icsLines.push("BEGIN:VALARM");
      icsLines.push("TRIGGER:-P1D");
      icsLines.push("ACTION:DISPLAY");
      icsLines.push(`DESCRIPTION:Reminder: ${escapeICalText(instance.name)}`);
      icsLines.push("END:VALARM");
    }

    icsLines.push("END:VEVENT");
  }

  icsLines.push("END:VCALENDAR");

  return icsLines.join("\r\n");
}

/**
 * Format date for iCalendar (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format date for iCalendar DATE type (YYYYMMDD)
 */
function formatICalDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * Parse date and time strings to Date object
 */
function parseDateTimeToDate(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Escape special characters for iCalendar text
 * According to RFC 5545, backslash, semicolon, comma, and newline must be escaped
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Backslash must be first
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Save iCalendar to file
 */
export async function saveICalendarFile(
  instances: TaskInstance[],
  filePath: string,
  calendarName: string = "Garden Tasks"
): Promise<void> {
  const icsContent = exportToICalendar(instances, calendarName);
  const fs = await import("node:fs/promises");
  await fs.writeFile(filePath, icsContent, "utf-8");
}

/**
 * Export filtered task instances to iCalendar file
 */
export async function exportTasksToCalendar(
  instances: TaskInstance[],
  options?: {
    status?: string[];
    categories?: string[];
    plantingId?: string;
    filePath?: string;
    calendarName?: string;
  }
): Promise<string> {
  let filteredInstances = [...instances];

  // Apply filters
  if (options?.status) {
    filteredInstances = filteredInstances.filter((i) => options.status!.includes(i.status));
  }
  if (options?.categories) {
    filteredInstances = filteredInstances.filter((i) => options.categories!.includes(i.category));
  }
  if (options?.plantingId) {
    filteredInstances = filteredInstances.filter(
      (i) => i.context?.plantingId === options.plantingId
    );
  }

  // Generate iCalendar
  const icsContent = exportToICalendar(filteredInstances, options?.calendarName);

  // Save to file if path provided
  if (options?.filePath) {
    await saveICalendarFile(filteredInstances, options.filePath, options.calendarName);
  }

  return icsContent;
}
