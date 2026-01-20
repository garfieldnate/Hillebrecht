/**
 * Add example task templates
 * Demonstrates all recurrence types and targeting options
 */

import { addTaskTemplate } from "../db/queries/tasks.queries.ts";
import { Season } from "../types/common.types.ts";

async function main() {
  console.log("Adding example task templates...\n");

  // ============================================================================
  // Calendar-based tasks
  // ============================================================================

  console.log("1. Calendar-based tasks:");

  await addTaskTemplate({
    id: "water-greenhouse-daily",
    name: "Water Greenhouse Plants",
    description: "Water all greenhouse plants thoroughly",
    category: "watering",
    recurrence: {
      type: "calendar",
      intervalType: "daily",
      intervalCount: 1,
      startDate: "2026-03-01",
      endDate: "2026-10-31",
    },
    instructions: "Check soil moisture before watering. Water until soil is moist but not soggy.",
    estimatedMinutes: 20,
    supplies: ["watering can", "hose"],
    priority: "high",
    isActive: true,
  });
  console.log("  ✓ Daily greenhouse watering");

  await addTaskTemplate({
    id: "fertilize-tomatoes-biweekly",
    name: "Fertilize Tomatoes",
    description: "Apply liquid fertilizer to all tomato plants",
    category: "fertilization",
    recurrence: {
      type: "calendar",
      intervalType: "weekly",
      intervalCount: 2,
      startDate: "2026-06-01",
      endDate: "2026-09-30",
      daysOfWeek: [1], // Mondays
    },
    appliesTo: {
      plantTags: ["food", "nightshade"],
    },
    instructions: "Mix 1 tbsp fish emulsion per gallon. Apply 1 cup per plant at base.",
    estimatedMinutes: 15,
    supplies: ["fish emulsion", "watering can", "measuring cup"],
    priority: "medium",
    isActive: true,
    tags: ["tomato", "fertilization"],
  });
  console.log("  ✓ Bi-weekly tomato fertilization");

  await addTaskTemplate({
    id: "check-pest-traps-weekly",
    name: "Check Pest Traps",
    description: "Inspect and replace pest monitoring traps",
    category: "pest-management",
    recurrence: {
      type: "calendar",
      intervalType: "weekly",
      intervalCount: 1,
      startDate: "2026-05-01",
      endDate: "2026-10-31",
      daysOfWeek: [5], // Fridays
    },
    instructions:
      "Check yellow sticky traps for aphids, whiteflies. Replace if full. Monitor for patterns.",
    estimatedMinutes: 10,
    supplies: ["yellow sticky traps", "notebook"],
    priority: "high",
    isActive: true,
    tags: ["pest-management", "monitoring"],
  });
  console.log("  ✓ Weekly pest trap monitoring\n");

  // ============================================================================
  // Seasonal tasks
  // ============================================================================

  console.log("2. Seasonal tasks:");

  await addTaskTemplate({
    id: "harvest-salad-greens-spring",
    name: "Harvest Salad Greens",
    description: "Harvest mature salad greens using cut-and-come-again method",
    category: "harvest",
    recurrence: {
      type: "seasonal",
      seasons: [Season.Spring, Season.Fall],
      weekInterval: 1, // Weekly during season
    },
    appliesTo: {
      plantTags: ["cool-season", "food"],
    },
    instructions: "Cut outer leaves 1-2 inches above soil. Leave center intact for regrowth.",
    estimatedMinutes: 15,
    supplies: ["garden scissors", "harvest basket"],
    priority: "medium",
    isActive: true,
    tags: ["harvest", "greens"],
  });
  console.log("  ✓ Seasonal salad green harvest");

  await addTaskTemplate({
    id: "mulch-beds-summer",
    name: "Refresh Mulch",
    description: "Add fresh mulch to garden beds",
    category: "maintenance",
    recurrence: {
      type: "seasonal",
      seasons: [Season.Summer],
      weekInterval: 8, // Every 8 weeks in summer
    },
    instructions: "Apply 2-3 inch layer of straw or wood chips. Keep mulch away from plant stems.",
    estimatedMinutes: 60,
    supplies: ["mulch", "wheelbarrow", "rake"],
    priority: "medium",
    isActive: true,
    tags: ["mulch", "maintenance"],
  });
  console.log("  ✓ Summer mulch refresh\n");

  // ============================================================================
  // Frost-relative tasks
  // ============================================================================

  console.log("3. Frost-relative tasks:");

  await addTaskTemplate({
    id: "prune-fruit-trees",
    name: "Prune Fruit Trees",
    description: "Perform dormant season pruning on fruit trees",
    category: "pruning",
    recurrence: {
      type: "frost-relative",
      frostTiming: {
        weeksFromFrost: -2,
        frostReference: "last-spring-frost",
      },
    },
    appliesTo: {
      plantTags: ["tree", "fruit"],
    },
    instructions:
      "Remove dead, diseased, crossing branches. Thin for air circulation. Make clean cuts at branch collar.",
    estimatedMinutes: 120,
    supplies: ["pruning shears", "loppers", "pruning saw", "pruning sealer"],
    priority: "high",
    isActive: true,
    tags: ["fruit-trees", "pruning"],
  });
  console.log("  ✓ Dormant season fruit tree pruning");

  await addTaskTemplate({
    id: "harden-off-transplants",
    name: "Harden Off Transplants",
    description: "Gradually acclimate indoor seedlings to outdoor conditions",
    category: "planting",
    recurrence: {
      type: "frost-relative",
      frostTiming: {
        weeksFromFrost: -1,
        frostReference: "last-spring-frost",
      },
    },
    instructions:
      "Start with 2 hours outside in shade. Increase time daily over 7-10 days. Bring in at night.",
    estimatedMinutes: 30,
    priority: "high",
    isActive: true,
    tags: ["transplants", "hardening-off"],
  });
  console.log("  ✓ Spring transplant hardening\n");

  // ============================================================================
  // Event-triggered tasks
  // ============================================================================

  console.log("4. Event-triggered tasks:");

  await addTaskTemplate({
    id: "fertilize-after-transplant",
    name: "Fertilize New Transplants",
    description: "Apply starter fertilizer to newly transplanted seedlings",
    category: "fertilization",
    recurrence: {
      type: "event-triggered",
      triggerEvent: "transplant",
      weeksAfterEvent: 2,
      repeatWeeks: 2,
      repeatCount: 3, // Fertilize 3 times after transplanting
    },
    instructions: "Apply half-strength balanced fertilizer. Water thoroughly after application.",
    estimatedMinutes: 10,
    supplies: ["balanced fertilizer", "watering can"],
    priority: "medium",
    isActive: true,
    tags: ["transplant", "fertilization"],
  });
  console.log("  ✓ Post-transplant fertilization schedule");

  await addTaskTemplate({
    id: "succession-plant-lettuce",
    name: "Succession Plant Lettuce",
    description: "Plant next round of lettuce seeds",
    category: "planting",
    recurrence: {
      type: "event-triggered",
      triggerEvent: "planting",
      weeksAfterEvent: 3,
      repeatWeeks: 3,
      repeatCount: 4, // 4 succession plantings
    },
    appliesTo: {
      plantIds: ["lettuce-buttercrunch"],
    },
    instructions: "Sow seeds 1/4 inch deep, 6 inches apart. Keep soil moist until germination.",
    estimatedMinutes: 15,
    supplies: ["lettuce seeds", "row marker", "watering can"],
    priority: "medium",
    isActive: true,
    tags: ["succession-planting", "lettuce"],
  });
  console.log("  ✓ Lettuce succession planting\n");

  // ============================================================================
  // One-time tasks
  // ============================================================================

  console.log("5. One-time tasks:");

  await addTaskTemplate({
    id: "spring-garden-cleanup-2026",
    name: "Spring Garden Cleanup",
    description: "Remove winter mulch, clean beds, prepare for planting",
    category: "maintenance",
    recurrence: {
      type: "one-time",
      date: "2026-04-01",
    },
    instructions:
      "Remove old mulch, pull weeds, add compost to beds, repair trellises, check irrigation.",
    estimatedMinutes: 240,
    supplies: ["rake", "wheelbarrow", "compost", "garden gloves"],
    priority: "high",
    isActive: true,
    tags: ["spring-prep", "cleanup"],
  });
  console.log("  ✓ Spring garden cleanup\n");

  // ============================================================================
  // Tasks with dependencies
  // ============================================================================

  console.log("6. General maintenance tasks:");

  await addTaskTemplate({
    id: "soil-test-annual",
    name: "Annual Soil Test",
    description: "Collect and test soil samples from each garden bed",
    category: "maintenance",
    recurrence: {
      type: "calendar",
      intervalType: "monthly",
      intervalCount: 12, // Annual
      startDate: "2026-03-01",
      dayOfMonth: 1,
    },
    instructions:
      "Collect samples from 6 inches deep. Mix samples from each bed. Send to extension office.",
    estimatedMinutes: 45,
    supplies: ["soil test kit", "trowel", "bags", "labels"],
    priority: "medium",
    isActive: true,
    tags: ["soil-test", "maintenance"],
  });
  console.log("  ✓ Annual soil testing");

  await addTaskTemplate({
    id: "tool-maintenance-monthly",
    name: "Clean and Sharpen Tools",
    description: "Clean, sharpen, and oil garden tools",
    category: "maintenance",
    recurrence: {
      type: "calendar",
      intervalType: "monthly",
      intervalCount: 1,
      startDate: "2026-04-01",
      dayOfMonth: 15,
    },
    instructions:
      "Remove soil, scrub with wire brush, sharpen edges, oil metal parts, tighten handles.",
    estimatedMinutes: 30,
    supplies: ["wire brush", "file", "oil", "rags"],
    priority: "low",
    isActive: true,
    tags: ["tools", "maintenance"],
  });
  console.log("  ✓ Monthly tool maintenance\n");

  console.log("✅ All example task templates added successfully!");
  console.log("\nTask templates created:");
  console.log("  - 3 Calendar-based tasks");
  console.log("  - 2 Seasonal tasks");
  console.log("  - 2 Frost-relative tasks");
  console.log("  - 2 Event-triggered tasks");
  console.log("  - 1 One-time task");
  console.log("  - 2 General maintenance tasks");
  console.log("\nTotal: 12 task templates");
}

main().catch(console.error);
