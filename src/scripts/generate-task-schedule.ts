/**
 * Generate task schedule and export to calendar
 * Demonstrates instance generation and calendar export
 */

import {
  generateInstancesForAllTemplates,
  getTaskInstancesByDateRange,
} from "../db/queries/tasks.queries.ts";
import { exportTasksToCalendar } from "../lib/icalendar-export.ts";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

async function main() {
  console.log("🗓️  Garden Task Schedule Generator\n");

  // Ensure export directory exists
  const exportDir = "./calendar-exports";
  if (!existsSync(exportDir)) {
    await mkdir(exportDir, { recursive: true });
    console.log(`✓ Created directory: ${exportDir}\n`);
  }

  // Define frost dates for location (example: USDA Zone 5)
  const frostDates = {
    lastSpringFrost: "2026-05-15",
    firstFallFrost: "2026-09-30",
  };

  console.log("Frost dates:");
  console.log(`  Last spring frost: ${frostDates.lastSpringFrost}`);
  console.log(`  First fall frost:  ${frostDates.firstFallFrost}\n`);

  // ============================================================================
  // Generate instances for different periods
  // ============================================================================

  // Spring 2026 (March - May)
  console.log("Generating Spring 2026 tasks...");
  const springInstances = await generateInstancesForAllTemplates(
    "2026-03-01",
    "2026-05-31",
    frostDates
  );
  console.log(`  ✓ Generated ${springInstances.length} task instances\n`);

  // Summer 2026 (June - August)
  console.log("Generating Summer 2026 tasks...");
  const summerInstances = await generateInstancesForAllTemplates(
    "2026-06-01",
    "2026-08-31",
    frostDates
  );
  console.log(`  ✓ Generated ${summerInstances.length} task instances\n`);

  // Fall 2026 (September - November)
  console.log("Generating Fall 2026 tasks...");
  const fallInstances = await generateInstancesForAllTemplates(
    "2026-09-01",
    "2026-11-30",
    frostDates
  );
  console.log(`  ✓ Generated ${fallInstances.length} task instances\n`);

  // ============================================================================
  // Export to iCalendar files
  // ============================================================================

  console.log("Exporting to calendar files...\n");

  // Export all tasks for the year
  const allInstancesYear = await getTaskInstancesByDateRange("2026-01-01", "2026-12-31");

  await exportTasksToCalendar(allInstancesYear, {
    filePath: `${exportDir}/garden-tasks-2026.ics`,
    calendarName: "Garden Tasks 2026",
  });
  console.log(`  ✓ ${exportDir}/garden-tasks-2026.ics`);
  console.log(`    (${allInstancesYear.length} tasks)\n`);

  // Export by season
  await exportTasksToCalendar(springInstances, {
    filePath: `${exportDir}/garden-tasks-spring-2026.ics`,
    calendarName: "Garden Tasks - Spring 2026",
  });
  console.log(`  ✓ ${exportDir}/garden-tasks-spring-2026.ics`);
  console.log(`    (${springInstances.length} tasks)\n`);

  await exportTasksToCalendar(summerInstances, {
    filePath: `${exportDir}/garden-tasks-summer-2026.ics`,
    calendarName: "Garden Tasks - Summer 2026",
  });
  console.log(`  ✓ ${exportDir}/garden-tasks-summer-2026.ics`);
  console.log(`    (${summerInstances.length} tasks)\n`);

  await exportTasksToCalendar(fallInstances, {
    filePath: `${exportDir}/garden-tasks-fall-2026.ics`,
    calendarName: "Garden Tasks - Fall 2026",
  });
  console.log(`  ✓ ${exportDir}/garden-tasks-fall-2026.ics`);
  console.log(`    (${fallInstances.length} tasks)\n`);

  // Export by category
  const maintenanceTasks = await getTaskInstancesByDateRange("2026-01-01", "2026-12-31");
  await exportTasksToCalendar(maintenanceTasks, {
    categories: ["maintenance"],
    filePath: `${exportDir}/garden-tasks-maintenance-2026.ics`,
    calendarName: "Garden Maintenance 2026",
  });
  const maintenanceCount = maintenanceTasks.filter((t) => t.category === "maintenance").length;
  console.log(`  ✓ ${exportDir}/garden-tasks-maintenance-2026.ics`);
  console.log(`    (${maintenanceCount} maintenance tasks)\n`);

  const harvestTasks = await getTaskInstancesByDateRange("2026-01-01", "2026-12-31");
  await exportTasksToCalendar(harvestTasks, {
    categories: ["harvest"],
    filePath: `${exportDir}/garden-tasks-harvest-2026.ics`,
    calendarName: "Garden Harvest 2026",
  });
  const harvestCount = harvestTasks.filter((t) => t.category === "harvest").length;
  console.log(`  ✓ ${exportDir}/garden-tasks-harvest-2026.ics`);
  console.log(`    (${harvestCount} harvest tasks)\n`);

  // Export only pending/in-progress tasks
  await exportTasksToCalendar(allInstancesYear, {
    status: ["pending", "in-progress"],
    filePath: `${exportDir}/garden-tasks-upcoming-2026.ics`,
    calendarName: "Upcoming Garden Tasks 2026",
  });
  const upcomingCount = allInstancesYear.filter((t) =>
    ["pending", "in-progress"].includes(t.status)
  ).length;
  console.log(`  ✓ ${exportDir}/garden-tasks-upcoming-2026.ics`);
  console.log(`    (${upcomingCount} upcoming tasks)\n`);

  // ============================================================================
  // Summary
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Task schedule generation complete!\n");
  console.log("Summary:");
  console.log(`  Total task instances generated: ${allInstancesYear.length}`);
  console.log(`    Spring: ${springInstances.length}`);
  console.log(`    Summer: ${summerInstances.length}`);
  console.log(`    Fall:   ${fallInstances.length}`);
  console.log(`\n  Exported calendar files: 7`);
  console.log("\nTo use these calendar files:");
  console.log("  1. Open Google Calendar (calendar.google.com)");
  console.log("  2. Click the '+' next to 'Other calendars'");
  console.log("  3. Select 'Import'");
  console.log("  4. Choose a .ics file from the calendar-exports/ directory");
  console.log("  5. Select which calendar to add events to");
  console.log("  6. Click 'Import'\n");
  console.log("Note: You can import multiple .ics files to separate calendars");
  console.log("      to organize tasks by season or category.");
}

main().catch(console.error);
