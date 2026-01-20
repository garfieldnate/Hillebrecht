# LLM Guide: Adding Tasks to Hillebrecht Garden Database

## Quick Start

Tasks help you track garden maintenance, planting schedules, harvests, and more. There are two types:

1. **Task Templates** - Recurring patterns (e.g., "Water tomatoes weekly")
2. **Task Instances** - Specific occurrences (e.g., "Water tomatoes on June 15, 2026")

## Adding Tasks

### Method 1: One-Time Task

For tasks that happen once:

```typescript
import { addTaskInstanceSimple } from "./src/api/tasks.api.ts";

await addTaskInstanceSimple({
  name: "Harvest First Tomatoes",
  dueDate: "2026-07-15",
  category: "harvest",
  plantId: "tomato-cherokee-purple"
});
```

### Method 2: Recurring Task Template

For tasks that repeat:

```typescript
import { addTaskTemplateSimple } from "./src/api/tasks.api.ts";

// Weekly watering
await addTaskTemplateSimple({
  name: "Water Tomatoes",
  category: "watering",
  recurrence: {
    type: "calendar",
    intervalType: "weekly",
    intervalCount: 1,
    startDate: "2026-06-01",
    endDate: "2026-09-30"
  },
  instructions: "Water deeply until soil is moist 6 inches down",
  estimatedMinutes: 15
});
```

## Task Categories

- **watering** - Irrigation tasks
- **fertilization** - Feeding plants
- **harvest** - Picking crops
- **planting** - Sowing seeds or transplanting
- **pruning** - Trimming plants
- **pest-management** - Dealing with pests/diseases
- **maintenance** - General upkeep
- **general** - Everything else

## Recurrence Types

### 1. Calendar-Based

Repeats on a fixed schedule:

```typescript
recurrence: {
  type: "calendar",
  intervalType: "weekly",  // or "daily", "monthly"
  intervalCount: 2,         // Every 2 weeks
  startDate: "2026-06-01",
  endDate: "2026-09-30",
  daysOfWeek: [1, 3, 5]    // Monday, Wednesday, Friday (optional)
}
```

### 2. Seasonal

Repeats during specific seasons:

```typescript
recurrence: {
  type: "seasonal",
  seasons: ["spring", "fall"],  // Cool season crops
  weekInterval: 2                // Every 2 weeks during those seasons
}
```

### 3. Frost-Relative

Based on frost dates:

```typescript
recurrence: {
  type: "frost-relative",
  weeksFromFrost: -2,  // 2 weeks before last spring frost
  frostReference: "last-spring-frost"  // or "first-fall-frost"
}
```

### 4. Event-Triggered

Based on other garden events:

```typescript
recurrence: {
  type: "event-triggered",
  triggerEvent: "planting",  // or "transplant", "harvest"
  weeksAfterEvent: 2         // 2 weeks after planting
}
```

### 5. One-Time

Happens once:

```typescript
recurrence: {
  type: "one-time",
  date: "2026-04-01"
}
```

## Examples

### Weekly Watering

```typescript
await addTaskTemplateSimple({
  name: "Water Greenhouse",
  category: "watering",
  recurrence: {
    type: "calendar",
    intervalType: "daily",
    intervalCount: 1,
    startDate: "2026-03-01",
    endDate: "2026-10-31"
  },
  estimatedMinutes: 20,
  supplies: ["watering can", "hose"]
});
```

### Bi-Weekly Fertilization

```typescript
await addTaskTemplateSimple({
  name: "Fertilize Tomatoes",
  category: "fertilization",
  recurrence: {
    type: "calendar",
    intervalType: "weekly",
    intervalCount: 2,
    startDate: "2026-06-01",
    endDate: "2026-09-30"
  },
  appliesTo: {
    plantTags: ["food", "nightshade"]
  },
  instructions: "Mix 1 tbsp fish emulsion per gallon. Apply 1 cup per plant.",
  supplies: ["fish emulsion", "watering can"],
  estimatedMinutes: 15
});
```

### Seasonal Harvest

```typescript
await addTaskTemplateSimple({
  name: "Harvest Salad Greens",
  category: "harvest",
  recurrence: {
    type: "seasonal",
    seasons: ["spring", "fall"],
    weekInterval: 1
  },
  appliesTo: {
    plantTags: ["cool-season", "food"]
  },
  instructions: "Cut outer leaves 1-2 inches above soil",
  estimatedMinutes: 15
});
```

### Post-Planting Care

```typescript
await addTaskTemplateSimple({
  name: "Check New Transplants",
  category: "maintenance",
  recurrence: {
    type: "event-triggered",
    triggerEvent: "transplant",
    weeksAfterEvent: 1
  },
  instructions: "Check for wilting, pests, and water needs",
  estimatedMinutes: 10
});
```

### One-Time Cleanup

```typescript
await addTaskInstanceSimple({
  name: "Spring Garden Cleanup",
  dueDate: "2026-04-01",
  category: "maintenance",
  instructions: "Remove winter mulch, pull weeds, repair trellises",
  estimatedMinutes: 240,
  priority: "high"
});
```

## Updating Task Status

```typescript
import { updateTaskStatus } from "./src/api/tasks.api.ts";

await updateTaskStatus("water-tomatoes-2026-06-15", "completed", {
  outcome: "successful",
  results: "All plants watered thoroughly",
  actualMinutes: 12
});
```

## Web Interface

You can also manage tasks through the web interface:

1. Start server: `bun src/server/index.ts`
2. Visit `http://localhost:3000/tasks.html`
3. Click "+ Add Task"
4. Fill in the form

## Tips

1. **Be specific** - "Water tomatoes" is better than "Water plants"
2. **Use categories** - Makes filtering and organizing easier
3. **Add instructions** - Future you will thank you
4. **Estimate time** - Helps with planning
5. **Track supplies** - Know what you'll need
6. **Set priorities** - Critical tasks stand out
7. **Use templates** - For anything that repeats

## Priority Levels

- **low** - Can wait if busy
- **medium** - Normal priority (default)
- **high** - Important, do soon
- **critical** - Must do now (e.g., frost protection)

## Status Values

- **pending** - Not started yet
- **in-progress** - Currently working on it
- **completed** - Done!
- **skipped** - Decided not to do it
- **cancelled** - No longer needed
- **blocked** - Waiting on something else
