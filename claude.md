# Claude Code Notes - Hillebrecht Garden Management

## Project Overview

This is a TypeScript-based garden seed inventory, task management, and seasonal planting plan management system. The database uses frost-relative timing to make plant data location-independent.

**Key Technologies:**

- **Database**: SQLite with Drizzle ORM
- **Runtime**: Bun for web server, Node.js (tsx) for scripts and direct data manipulation
- **Frontend**: HTMX-based web interface (no heavy frameworks)
- **APIs**: Simplified, LLM-friendly TypeScript APIs for easy data entry

## Project Structure

```
hillebrecht/
├── src/
│   ├── types/
│   │   ├── common.types.ts      # Shared enums and base types
│   │   ├── plant.types.ts       # Plant interface and related types
│   │   ├── planting.types.ts    # Planting interface and related types
│   │   └── task.types.ts        # Task template and instance types
│   ├── db/
│   │   ├── client.ts            # Bun SQLite client (for web server)
│   │   ├── client.node.ts       # Node.js better-sqlite3 client (for scripts/direct execution)
│   │   ├── schema/
│   │   │   ├── plants.schema.ts # Plant table schema
│   │   │   ├── plantings.schema.ts # Plantings table schema
│   │   │   ├── tasks.schema.ts  # Task templates and instances schema
│   │   │   └── index.ts         # Schema exports
│   │   ├── queries/
│   │   │   └── tasks.queries.ts # Task query functions
│   │   └── migrations/          # Drizzle migrations
│   ├── api/
│   │   ├── plants.api.ts        # Simplified plant API (LLM-friendly)
│   │   ├── plantings.api.ts     # Simplified planting API (LLM-friendly)
│   │   └── tasks.api.ts         # Simplified task API (LLM-friendly)
│   ├── lib/
│   │   ├── task-generator.ts    # Task instance generation logic
│   │   └── icalendar-export.ts  # Calendar export functionality
│   ├── web/
│   │   ├── index.html           # Main navigation page
│   │   ├── plants.html          # Plant list interface
│   │   ├── add-plant.html       # Add plant form
│   │   ├── tasks.html           # Task list interface
│   │   ├── add-task.html        # Add task form
│   │   ├── plantings.html       # Planting list interface
│   │   ├── add-planting.html    # Add planting form
│   │   └── style.css            # Shared styles
│   └── scripts/
│       ├── add-example-tasks.ts # Example task templates
│       ├── generate-task-schedule.ts # Generate task schedule
│       └── test-task-system.ts  # Task system tests
├── data/                         # SQLite database files
│   └── garden.db
├── calendar-exports/             # Generated .ics calendar files
├── package.json                  # Using pnpm as package manager
├── tsconfig.json
├── LLM_PLANT_GUIDE.md           # Complete guide for adding plants
├── LLM_TASKS_GUIDE.md           # Complete guide for adding tasks
├── LLM_PLANTINGS_GUIDE.md       # Complete guide for tracking plantings
└── WEB_INTERFACE_README.md      # Web interface documentation
```

## User Preferences

### Seed Tagging Conventions

When adding new seeds to the database, follow these tagging rules:

1. **Always add the distributor/source as a tag**

   - Example: `"freeheirloomseeds.org"`, `"baker-creek"`, `"johnny-seeds"`
   - Use lowercase with hyphens for consistency

2. **Add the distributor's product ID as a tag**

   - Include the hashtag/product code from the source
   - Example: `"#ASP1"`, `"#BA3"`, `"#TOM45"`
   - Keep the original format (including # symbol)

3. **REQUIRED: Add lifecycle tag** (exactly ONE required)

   - `"annual"` - completes life cycle in one growing season
   - `"perennial"` - lives multiple years
   - `"biennial"` - completes life cycle in two years

4. **REQUIRED: Add purpose tag** (at least ONE required)

   - `"food"` - edible plants (vegetables, fruits, culinary herbs)
   - `"flower"` - ornamental flowers grown for beauty
   - `"medicinal"` - plants with medicinal properties
   - **Note:** Plants can have multiple purpose tags (e.g., yarrow is both "flower" and "medicinal")

5. **Add descriptive tags** (optional but recommended)

   - Season: `"cool-season"`, `"warm-season"`
   - Special characteristics: `"heirloom"`, `"drought-tolerant"`, `"pollinator-friendly"`
   - Growing method: `"succession-plant"`, `"cut-and-come-again"`
   - Hardiness zones: `"zones-3-9"`, `"zone-4"`
   - Plant family: `"brassica"`, `"nightshade"`, `"allium"`, etc.

6. **Example complete tag set:**
   ```typescript
   tags: [
     "perennial", // lifecycle (REQUIRED)
     "food", // purpose (REQUIRED)
     "zones-3-9", // descriptive
     "freeheirloomseeds.org", // distributor
     "#ASP1", // product ID
     "long-lived", // descriptive
   ];
   ```
7. **Use web search:** Always consult the distributor's website and other reputable sources to find the correct growing information and tags for each plant variety.

### Handling Duplicate Plants from Different Distributors

**IMPORTANT:** If the user tries to add a seed from a new distributor that has the **same common name AND variety name** as an existing plant:

- **DO NOT create a duplicate entry**
- **Instead, add the new distributor as a tag** to the existing plant
- **Add the new distributor's product ID** as a tag
- **Update the notes** to mention both sources
- **Update metadata.source** to list both sources (comma-separated)

**Example:**
If "Tomato - Cherokee Purple" already exists from Baker Creek, and user wants to add the same variety from Johnny's Seeds:

```typescript
// Before:
tags: ["heirloom", "indeterminate", "baker-creek", "#TOM12"];
metadata: {
  source: "Baker Creek Heirloom Seeds";
}

// After:
tags: [
  "heirloom",
  "indeterminate",
  "baker-creek",
  "#TOM12",
  "johnny-seeds",
  "#JS-456",
];
metadata: {
  source: "Baker Creek Heirloom Seeds, Johnny's Selected Seeds";
}
notes: "... Also available from Johnny's Selected Seeds (#JS-456)...";
```

## Type System Notes

### Frost-Relative Timing

All planting dates use `FrostRelativeTiming` to make data location-independent:

- `weeksFromFrost`: number (positive = after, negative = before, 0 = on frost date)
- `frostReference`: "last-spring-frost" | "first-fall-frost"

Example:

```typescript
springTiming: {
  indoorStart: {
    earliest: { weeksFromFrost: -6, frostReference: "last-spring-frost" },
    latest: { weeksFromFrost: -4, frostReference: "last-spring-frost" }
  }
}
```

### Germination Requirements

Plants requiring special pre-planting treatment use the `germinationRequirements` field:

**Stratification** (cold/warm treatment):

- Required for: Asparagus, Yarrow, some perennials
- Start weeks before planting time
- Critical for scheduling!

**Soaking**:

- Required for: Parsley and other slow germinators
- Usually 12-24 hours before planting

**Light requirements**:

- Some seeds need light to germinate (don't cover)
- Examples: Yarrow, Sweet William

**Example:**

```typescript
germinationRequirements: {
  stratification: {
    type: "cold",
    duration: 28, // days
    temperature: 38, // Fahrenheit
    notes: "Start 10-15 weeks before last frost"
  },
  soaking: {
    duration: 24, // hours
    temperature: 110,
    notes: "Warm water soak before planting"
  },
  lightRequirement: "light",
  specialNotes: "Surface sow, do not cover"
}
```

## Database Architecture

### Dual-Client System

The project uses **two separate database clients** to support different execution contexts:

1. **`src/db/client.ts`** - Bun SQLite client (`bun:sqlite`)

   - Used by: Web server, Bun-native scripts
   - Purpose: High-performance server operations
   - When to use: Server endpoints, production code

2. **`src/db/client.node.ts`** - Node.js better-sqlite3 client
   - Used by: Scripts, direct data manipulation, CLI tools
   - Purpose: Node.js compatibility for `pnpm tsx` execution
   - When to use: Scripts, direct execution, testing

**CRITICAL:** All API files (`src/api/*.api.ts`) **MUST** import from `client.node.ts` to allow direct execution with `pnpm tsx`. This enables Claude to add data directly to the database without requiring the user to run scripts.

```typescript
// CORRECT - Allows direct execution with pnpm tsx
import { db } from "../db/client.node.ts";

// WRONG - Only works with Bun, prevents direct execution
import { db } from "../db/client.ts";
```

### Simplified APIs for LLM-Friendly Data Entry

Three simplified APIs make it easy to add data with minimal required fields:

#### 1. Plants API (`src/api/plants.api.ts`)

```typescript
import { addPlantSimple } from "./src/api/plants.api.ts";

// Minimal - just commonName and variety required
await addPlantSimple({
  commonName: "Tomato",
  variety: "Cherokee Purple",
  tags: ["annual", "food"],
});

// Full detail with all optional fields
await addPlantSimple({
  commonName: "Squash",
  variety: "Kabocha",
  scientificName: "Cucurbita maxima",
  daysToMaturity: 95,
  sunRequirement: "full-sun",
  waterRequirement: "moderate",
  spacingInches: 36,
  rowSpacingInches: 72,
  source: "Annie's Heirloom Seeds",
  tags: ["annual", "food", "warm-season", "heirloom"],
});
```

#### 2. Tasks API (`src/api/tasks.api.ts`)

```typescript
import {
  addTaskTemplateSimple,
  addTaskInstanceSimple,
} from "./src/api/tasks.api.ts";

// Add recurring task template
await addTaskTemplateSimple({
  name: "Water Tomatoes",
  category: "watering",
  recurrence: {
    type: "calendar",
    intervalType: "weekly",
    intervalCount: 1,
    startDate: "2026-06-01",
  },
});

// Add one-time task instance
await addTaskInstanceSimple({
  name: "Harvest Tomatoes",
  dueDate: "2026-07-15",
  category: "harvest",
  plantId: "tomato-cherokee-purple",
});
```

#### 3. Plantings API (`src/api/plantings.api.ts`)

```typescript
import { addPlantingSimple } from "./src/api/plantings.api.ts";

// Track what's actually planted
await addPlantingSimple({
  plantId: "tomato-cherokee-purple",
  year: 2026,
  season: "spring",
  quantity: 6,
  bedId: "raised-bed-1",
});
```

### Direct Execution Pattern

Claude can now add data directly to the database without user intervention:

```bash
# Claude executes this directly when adding plants
pnpm tsx -e "import { addPlantSimple } from './src/api/plants.api.ts'; await addPlantSimple({ commonName: 'Basil', variety: 'Genovese', tags: ['annual', 'food'] });"
```

This pattern enables:

- ✅ Direct database manipulation by Claude
- ✅ No need for user to run scripts
- ✅ Immediate feedback on success/failure
- ✅ Type-safe data entry
- ✅ Automatic ID generation and validation

## Database Query Functions

### Task Queries (`src/db/queries/tasks.queries.ts`)

**Template Operations:**

- `getTaskTemplateById(id)` - Find specific template
- `getActiveTaskTemplates()` - Get all active templates
- `getTaskTemplatesByCategory(category)` - Filter by category
- `addTaskTemplate(template)` - Create new template
- `updateTaskTemplate(id, updates)` - Update template
- `deleteTaskTemplate(id)` - Remove template

**Instance Operations:**

- `getTaskInstanceById(id)` - Find specific instance
- `getTaskInstancesByStatus(status)` - Filter by status
- `getTaskInstancesByDateRange(start, end)` - Get tasks in date range
- `getOverdueTaskInstances()` - Find overdue tasks
- `addTaskInstance(instance)` - Create task instance
- `completeTaskInstance(id, outcome, results)` - Mark task complete

**Instance Generation:**

- `generateInstancesFromTemplate(templateId, startDate, endDate)` - Generate scheduled tasks
- `generateInstancesForAllTemplates(startDate, endDate)` - Batch generate for all templates
- `exportTasksToCalendar(startDate, endDate, options)` - Export to iCalendar (.ics) format

### Web Interface

HTMX-based web interface for managing all data (no React/Vue):

- **Plants**: Browse, search, add plants with web forms
- **Tasks**: View task templates and instances, create new tasks
- **Plantings**: Track what's planted, log harvests

Access via web server (when running).

## Common Workflows

### Adding Seeds from a Distributor

1. Research the plant variety online
2. Check if plant already exists: `searchPlants("variety name")`
3. If exists with same common name + variety:
   - Add new distributor tag
   - Add new product ID tag
   - Update metadata.source
   - Update notes
4. If new variety:
   - Create complete Plant object
   - Use standard horticultural knowledge to fill gaps
   - Add distributor and product ID tags
   - Include germination requirements if needed

### Research Checklist for New Plants

When researching a new plant variety, gather:

- ✅ Common name, variety, scientific name
- ✅ Days to maturity
- ✅ Spacing (between plants, rows, square foot)
- ✅ Sun requirements (full/partial/shade)
- ✅ Water requirements (low/moderate/high)
- ✅ Soil pH range and richness needs
- ✅ Frost tolerance (seedling and mature)
- ✅ Planting method (direct seed/transplant/either)
- ✅ Planting timing relative to frost dates
- ✅ Harvest stages and timing
- ✅ Special germination needs (stratification/soaking)
- ✅ Companion plants (beneficial and detrimental)
- ✅ Common pests and diseases
- ✅ Care notes (fertilizing, support, etc.)

### Verification Steps

After making changes:

```bash
pnpm run type-check
```

Should complete with no errors.

## Current Database Stats

- **Total plants**: 80
  - 2 original examples (Tomato, Lettuce)
  - 57 from freeheirloomseeds.org
  - 1 Beit Alpha cucumber
  - 4 from GreenSeed (via agri co-op)
  - 5 from Burpee
  - 1 home-saved (Lilac)
  - 10 from Plantura (German herb set with BIO certification)
  - 1 from Annie's Heirloom Seeds (Kabocha squash)
- **By lifecycle**: 45 annual, 16 perennial, 19 biennial
- **By purpose**: 66 food, 15 flower, 9 medicinal (some plants have multiple purposes)
- **Plants with special germination requirements**: 13
  - Asparagus (2 varieties) - cold stratification + soaking
  - Yarrow - cold stratification + light
  - Lovage - cold stratification (optional)
  - Sweet William (2 varieties) - cold stratification (optional) + light
  - Parsley (3 varieties) - warm water soaking
  - Lilac - cold stratification (40-60 days)
  - Russell Hybrid Lupine - scarification + soaking + cold stratification (optional)
  - Rosemary - can be slow to germinate (14-21 days)
  - Thyme - surface sow with light

## Important Reminders

1. **Frost-relative timing** is key - never use specific calendar dates in plant data
2. **Germination requirements** need to be tracked for scheduling
3. **Stratification** must start weeks/months before planting
4. **Use pnpm** as the package manager (not npm or bun)
5. **Type safety** - always run type-check after changes
6. **Duplicate prevention** - check for existing varieties before adding
7. **Tag consistency** - use lowercase with hyphens for distributor names
8. **API imports** - ALWAYS import from `client.node.ts` in API files to enable direct execution
9. **Direct execution** - Use `pnpm tsx` to execute TypeScript files directly
10. **Simplified APIs** - Use the `addPlantSimple()`, `addTaskTemplateSimple()`, and `addPlantingSimple()` functions for easy data entry

## Implemented Features

✅ **SQLite Database** - Full migration from TypeScript arrays to SQLite with Drizzle ORM
✅ **Task Management System** - Two-tier task system (templates + instances) with 5 recurrence types
✅ **Calendar Export** - iCalendar (.ics) format for Google Calendar integration
✅ **Simplified APIs** - LLM-friendly APIs with minimal required fields
✅ **Web Interface** - HTMX-based UI for plants, tasks, and plantings
✅ **Direct Data Entry** - Claude can add data directly without user intervention
✅ **Planting Tracking** - Track actual plantings with harvest logging

## Future Enhancements

Planned features not yet implemented:

- Garden bed configuration database with layout visualization
- Automatic schedule generation from frost dates and planting plans
- Space planning algorithms for bed layout optimization
- Crop rotation tracking and recommendations
- Photo attachments for plants, tasks, and harvests
- Mobile app or responsive web design
- Weather integration for task rescheduling
- Analytics and reporting on garden productivity

## Useful Commands

```bash
# Type checking
pnpm run type-check

# Database operations
pnpm db:generate          # Generate new migration from schema changes
pnpm db:migrate           # Apply migrations to database
pnpm db:studio            # Open Drizzle Studio to browse database

# Direct data entry (Claude can execute these)
pnpm tsx -e "import { addPlantSimple } from './src/api/plants.api.ts'; await addPlantSimple({ commonName: 'Basil', variety: 'Genovese', tags: ['annual', 'food'] });"

# Run scripts
pnpm tsx src/scripts/add-example-tasks.ts           # Add example task templates
pnpm tsx src/scripts/generate-task-schedule.ts      # Generate task schedule
pnpm tsx src/scripts/test-task-system.ts            # Test task system

# Query database with sqlite3
sqlite3 data/garden.db "SELECT commonName, variety FROM plants WHERE commonName LIKE '%Tomato%';"
sqlite3 data/garden.db "SELECT COUNT(*) FROM plants;"
```

## LLM Guide Documents

For detailed instructions on adding data:

- **LLM_PLANT_GUIDE.md** - Complete guide for researching and adding plants
- **LLM_TASKS_GUIDE.md** - Examples for all 5 task recurrence types
- **LLM_PLANTINGS_GUIDE.md** - Workflow for tracking plantings and harvests
- **WEB_INTERFACE_README.md** - Overview of the complete web interface system
