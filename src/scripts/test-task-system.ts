/**
 * Test task management system
 * Verifies all query functions, generation logic, and calendar export
 */

import {
  getActiveTaskTemplates,
  getTaskTemplateById,
  getTaskTemplatesByCategory,
  getTaskTemplatesByTag,
  addTaskTemplate,
  addTaskInstance,
  getTaskInstanceById,
  getTaskInstancesByStatus,
  getTaskInstancesByDateRange,
  getOverdueTaskInstances,
  completeTaskInstance,
  isTaskInstanceBlocked,
  addTaskInstanceDependency,
  generateInstancesFromTemplate,
} from "../db/queries/tasks.queries.ts";
import { exportToICalendar } from "../lib/icalendar-export.ts";
import type { TaskTemplate, TaskInstance } from "../types/task.types.ts";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.log(`  ✗ ${message}`);
    testsFailed++;
  }
}

async function main() {
  console.log("🧪 Testing Task Management System\n");
  console.log("═══════════════════════════════════════════════════════\n");

  // ============================================================================
  // Test 1: Task Template Queries
  // ============================================================================

  console.log("Test 1: Task Template Queries");

  const templates = await getActiveTaskTemplates();
  assert(templates.length > 0, `Retrieved ${templates.length} active templates`);

  const firstTemplate = templates[0];
  assert(!!firstTemplate.id, "Template has ID");
  assert(!!firstTemplate.name, "Template has name");
  assert(!!firstTemplate.category, "Template has category");
  assert(!!firstTemplate.recurrence, "Template has recurrence pattern");

  const templateById = await getTaskTemplateById(firstTemplate.id);
  assert(!!templateById, "Can retrieve template by ID");
  assert(templateById?.id === firstTemplate.id, "Retrieved correct template");

  const maintenanceTemplates = await getTaskTemplatesByCategory("maintenance");
  assert(maintenanceTemplates.length > 0, `Found ${maintenanceTemplates.length} maintenance tasks`);

  console.log();

  // ============================================================================
  // Test 2: Instance Generation
  // ============================================================================

  console.log("Test 2: Instance Generation");

  const testTemplate = templates.find((t) => t.recurrence.type === "calendar");
  if (testTemplate) {
    const instances = await generateInstancesFromTemplate(
      testTemplate.id,
      "2026-06-01",
      "2026-06-30",
      {
        lastSpringFrost: "2026-05-15",
        firstFallFrost: "2026-09-30",
      }
    );

    assert(instances.length > 0, `Generated ${instances.length} instances from calendar template`);

    if (instances.length > 0) {
      const instance = instances[0];
      assert(!!instance.id, "Instance has ID");
      assert(!!instance.name, "Instance has name");
      assert(!!instance.dueDate, "Instance has due date");
      assert(instance.status === "pending", "Instance starts with pending status");
      assert(instance.templateId === testTemplate.id, "Instance linked to template");
    }
  }

  console.log();

  // ============================================================================
  // Test 3: Instance Queries
  // ============================================================================

  console.log("Test 3: Instance Queries");

  const pendingInstances = await getTaskInstancesByStatus("pending");
  assert(
    pendingInstances.length > 0,
    `Retrieved ${pendingInstances.length} pending instances`
  );

  const juneInstances = await getTaskInstancesByDateRange("2026-06-01", "2026-06-30");
  assert(juneInstances.length > 0, `Retrieved ${juneInstances.length} instances for June`);

  const overdueInstances = await getOverdueTaskInstances();
  console.log(`  ℹ Found ${overdueInstances.length} overdue instances`);

  console.log();

  // ============================================================================
  // Test 4: Instance Completion
  // ============================================================================

  console.log("Test 4: Instance Completion");

  if (pendingInstances.length > 0) {
    const testInstance = pendingInstances[0];
    const completed = await completeTaskInstance(
      testInstance.id,
      "successful",
      "Test completion - system working correctly"
    );

    assert(!!completed, "Instance completed successfully");
    assert(completed?.status === "completed", "Instance status updated to completed");
    assert(!!completed?.completedDate, "Completion date recorded");
    assert(completed?.outcome === "successful", "Outcome recorded");
    assert(!!completed?.results, "Results recorded");

    // Verify it's no longer in pending
    const stillPending = await getTaskInstancesByStatus("pending");
    const found = stillPending.find((i) => i.id === testInstance.id);
    assert(!found, "Completed instance removed from pending list");
  }

  console.log();

  // ============================================================================
  // Test 5: Dependencies
  // ============================================================================

  console.log("Test 5: Task Dependencies");

  // Create a test scenario with dependencies
  const testInstanceA: TaskInstance = {
    id: "test-instance-a",
    name: "Test Task A",
    category: "maintenance",
    dueDate: "2026-07-01",
    status: "pending",
    metadata: {
      dateCreated: new Date().toISOString(),
      generatedBy: "manual",
    },
  };

  const testInstanceB: TaskInstance = {
    id: "test-instance-b",
    name: "Test Task B (depends on A)",
    category: "maintenance",
    dueDate: "2026-07-02",
    status: "pending",
    metadata: {
      dateCreated: new Date().toISOString(),
      generatedBy: "manual",
    },
  };

  await addTaskInstance(testInstanceA);
  await addTaskInstance(testInstanceB);
  await addTaskInstanceDependency(testInstanceB.id, testInstanceA.id, "required");

  const isBlocked = await isTaskInstanceBlocked(testInstanceB.id);
  assert(isBlocked, "Task B is blocked by incomplete Task A");

  // Complete Task A
  await completeTaskInstance(testInstanceA.id, "successful");

  const stillBlocked = await isTaskInstanceBlocked(testInstanceB.id);
  assert(!stillBlocked, "Task B is no longer blocked after Task A completion");

  console.log();

  // ============================================================================
  // Test 6: Calendar Export
  // ============================================================================

  console.log("Test 6: Calendar Export");

  const exportInstances = await getTaskInstancesByDateRange("2026-06-01", "2026-06-30");
  const icsContent = exportToICalendar(exportInstances.slice(0, 5), "Test Calendar");

  assert(icsContent.includes("BEGIN:VCALENDAR"), "iCalendar header present");
  assert(icsContent.includes("VERSION:2.0"), "iCalendar version specified");
  assert(icsContent.includes("BEGIN:VEVENT"), "Events included");
  assert(icsContent.includes("END:VCALENDAR"), "iCalendar footer present");
  assert(icsContent.includes("SUMMARY:"), "Event summaries present");
  assert(icsContent.includes("DTSTART:"), "Event start dates present");

  console.log(`  ℹ Generated iCalendar with ${exportInstances.slice(0, 5).length} events`);
  console.log(`  ℹ Calendar size: ${icsContent.length} bytes`);

  console.log();

  // ============================================================================
  // Test 7: Template Tags
  // ============================================================================

  console.log("Test 7: Template Tags");

  const taggedTemplates = await getTaskTemplatesByTag("pest-management");
  console.log(`  ℹ Found ${taggedTemplates.length} templates with 'pest-management' tag`);

  console.log();

  // ============================================================================
  // Test 8: Recurrence Pattern Types
  // ============================================================================

  console.log("Test 8: Recurrence Pattern Coverage");

  const recurrenceTypes = {
    calendar: 0,
    seasonal: 0,
    "frost-relative": 0,
    "event-triggered": 0,
    "one-time": 0,
  };

  for (const template of templates) {
    const type = template.recurrence.type;
    if (type in recurrenceTypes) {
      recurrenceTypes[type as keyof typeof recurrenceTypes]++;
    }
  }

  console.log("  Recurrence pattern distribution:");
  for (const [type, count] of Object.entries(recurrenceTypes)) {
    console.log(`    ${type}: ${count} templates`);
  }

  const allTypesPresent = Object.values(recurrenceTypes).every((count) => count > 0);
  assert(allTypesPresent, "All recurrence types represented in templates");

  console.log();

  // ============================================================================
  // Test 9: Task Categories
  // ============================================================================

  console.log("Test 9: Task Categories");

  const categories = [
    "maintenance",
    "planting",
    "harvest",
    "pruning",
    "pest-management",
    "fertilization",
    "watering",
  ];

  for (const category of categories) {
    const catTemplates = await getTaskTemplatesByCategory(category);
    console.log(`  ${category}: ${catTemplates.length} templates`);
  }

  console.log();

  // ============================================================================
  // Test 10: Instance Retrieval by ID
  // ============================================================================

  console.log("Test 10: Instance Retrieval");

  if (juneInstances.length > 0) {
    const testId = juneInstances[0].id;
    const retrieved = await getTaskInstanceById(testId);

    assert(!!retrieved, "Can retrieve instance by ID");
    assert(retrieved?.id === testId, "Retrieved correct instance");
    assert(!!retrieved?.name, "Instance has name");
    assert(!!retrieved?.dueDate, "Instance has due date");
  }

  console.log();

  // ============================================================================
  // Summary
  // ============================================================================

  console.log("═══════════════════════════════════════════════════════");
  console.log("Test Summary:\n");
  console.log(`  ✓ Tests passed: ${testsPassed}`);
  console.log(`  ✗ Tests failed: ${testsFailed}`);
  console.log(`  Total tests:    ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log("✅ All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Please review the output above.");
  }
}

main().catch(console.error);
