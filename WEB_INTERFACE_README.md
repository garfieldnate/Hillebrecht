# Hillebrecht Garden - Web Interface Guide

## Overview

The Hillebrecht Garden Management System now has a complete web interface for managing:
- **Plants** - Your seed/plant variety database
- **Plantings** - What's actually growing in your garden
- **Tasks** - Garden maintenance and to-do items

All interfaces use HTMX for dynamic updates (no heavy JavaScript frameworks needed!).

## Starting the Server

```bash
bun src/server/index.ts
```

Then open your browser to: **http://localhost:3000**

## File Structure

```
src/
├── api/
│   ├── plants.api.ts      # Simplified plant API
│   ├── tasks.api.ts       # Simplified tasks API
│   └── plantings.api.ts   # Simplified plantings API
├── server/
│   └── index.ts           # Bun web server
└── web/
    ├── index.html         # Plant database list
    ├── add-plant.html     # Add new plant form
    ├── tasks.html         # Task list
    ├── add-task.html      # Add new task form
    ├── plantings.html     # Planting list
    ├── add-planting.html  # Add new planting form
    └── style.css          # Shared styles
```

## Web Pages

### Plants (`/` or `/index.html`)
- **View** all plant varieties in your database
- **Search** by name or variety (live search)
- **Filter** by tags, lifecycle, purpose
- **Navigate** to add new plants

### Add Plant (`/add-plant.html`)
- **Add** new plant varieties
- **Required**: Common name, variety
- **Optional**: Everything else has sensible defaults
- **Validation**: Type-safe form fields

### Plantings (`/plantings.html`)
- **View** what's currently growing
- **Filter** by season, year, status
- **Track** progress through the growing season
- **Update** status as plants grow

### Add Planting (`/add-planting.html`)
- **Record** new plantings
- **Required**: Plant ID, year, season
- **Optional**: Location, dates, quantities
- **Track**: From seed to harvest

### Tasks (`/tasks.html`)
- **View** garden tasks
- **Filter** by status, category
- **Track** completion
- **See** what's due soon

### Add Task (`/add-task.html`)
- **Create** one-time or recurring tasks
- **Schedule**: Calendar, seasonal, or frost-relative
- **Organize**: By category and priority
- **Plan**: Estimate time and list supplies

## API Endpoints

### Plants
- `GET  /api/plants` - List all plants (supports `?q=search`)
- `POST /api/plants` - Add new plant
- `GET  /api/stats` - Database statistics

### Tasks (To be implemented in server)
- `GET  /api/tasks` - List tasks (supports `?status=&category=`)
- `POST /api/tasks` - Add task template or instance
- `PUT  /api/tasks/:id/status` - Update task status

### Plantings (To be implemented in server)
- `GET  /api/plantings` - List plantings (supports `?year=&season=&status=`)
- `POST /api/plantings` - Add new planting
- `PUT  /api/plantings/:id/status` - Update planting status
- `POST /api/plantings/:id/harvest` - Log a harvest

## Using the APIs Programmatically

### Plants

```typescript
import { addPlantSimple } from "./src/api/plants.api.ts";

await addPlantSimple({
  commonName: "Tomato",
  variety: "Cherokee Purple",
  tags: ["annual", "food", "heirloom"]
});
```

See [LLM_PLANT_GUIDE.md](./LLM_PLANT_GUIDE.md) for complete documentation.

### Tasks

```typescript
import { addTaskTemplateSimple, addTaskInstanceSimple } from "./src/api/tasks.api.ts";

// Recurring task
await addTaskTemplateSimple({
  name: "Water Tomatoes",
  category: "watering",
  recurrence: {
    type: "calendar",
    intervalType: "weekly",
    intervalCount: 1,
    startDate: "2026-06-01"
  }
});

// One-time task
await addTaskInstanceSimple({
  name: "Harvest First Tomatoes",
  dueDate: "2026-07-15",
  category: "harvest"
});
```

See [LLM_TASKS_GUIDE.md](./LLM_TASKS_GUIDE.md) for complete documentation.

### Plantings

```typescript
import { addPlantingSimple, updatePlantingStatus, logHarvest } from "./src/api/plantings.api.ts";

// Add a planting
await addPlantingSimple({
  plantId: "tomato-cherokee-purple",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-1",
  quantity: 6
});

// Update status
await updatePlantingStatus("tomato-cherokee-purple-2026-spring-raised-bed-1", "harvesting");

// Log harvest
await logHarvest("tomato-cherokee-purple-2026-spring-raised-bed-1", {
  date: "2026-07-15",
  amount: "5 lbs",
  notes: "Excellent flavor!"
});
```

See [LLM_PLANTINGS_GUIDE.md](./LLM_PLANTINGS_GUIDE.md) for complete documentation.

## HTMX Features

The web interface uses HTMX for dynamic behavior:

- **Live Search** - Type to filter results instantly
- **Dynamic Forms** - Submit without page reload
- **Auto-Refresh** - Lists update when items are added
- **Filters** - Change filters and see results immediately
- **No JavaScript Required** - All interactivity via HTMX attributes

## Styling

The interface uses a clean, garden-themed design:
- **Green color scheme** - Natural and calming
- **Responsive** - Works on desktop and mobile
- **Accessible** - Semantic HTML with proper labels
- **Fast** - No heavy JavaScript framework overhead

## Development Workflow

### Adding New Plants

1. Research the plant variety online
2. Open http://localhost:3000/add-plant.html
3. Fill in the form (only name and variety required!)
4. Submit
5. Plant appears in the main list

### Planning Your Season

1. Add plant varieties you want to grow
2. Create plantings for each variety
3. Set up recurring tasks (watering, fertilizing, etc.)
4. Track progress through the season
5. Log harvests as they come in

### Daily Garden Management

1. Check tasks page for what's due today
2. Update task status as you complete them
3. Update planting status as plants grow
4. Log harvests when you pick crops
5. Add notes about observations

## Future Enhancements

The server currently implements plant management. To complete the system, the server needs:

1. **Task endpoints** - CRUD operations for tasks
2. **Planting endpoints** - CRUD operations for plantings
3. **Calendar export** - Download tasks as .ics files
4. **Reports** - Harvest totals, task completion stats
5. **Search improvements** - Full-text search across all data

The APIs are ready - they just need to be wired up to HTTP endpoints!

## Troubleshooting

### Server Won't Start

Make sure Bun is installed:
```bash
bun --version
```

### Can't Add Plants

Check the browser console for errors. Most common issues:
- Missing required fields (name, variety)
- Duplicate plant IDs
- Invalid enum values (use exact strings from examples)

### Tasks/Plantings Don't Show

The server needs to be updated to implement those endpoints. The APIs exist (`src/api/*.ts`) but need server route handlers.

## Tips for LLMs

When helping users add data:

1. **Plants**: Use `addPlantSimple()` - only name and variety required
2. **Tasks**: Use `addTaskTemplateSimple()` for recurring, `addTaskInstanceSimple()` for one-time
3. **Plantings**: Use `addPlantingSimple()` - only plantId, year, season required
4. **Research**: Check seed company websites for accurate plant data
5. **Defaults**: APIs have sensible defaults - don't stress about missing fields
6. **Tags**: Follow the conventions in the guides (lifecycle, purpose, characteristics)

## Resources

- [LLM_PLANT_GUIDE.md](./LLM_PLANT_GUIDE.md) - Complete plant API documentation
- [LLM_TASKS_GUIDE.md](./LLM_TASKS_GUIDE.md) - Complete tasks API documentation
- [LLM_PLANTINGS_GUIDE.md](./LLM_PLANTINGS_GUIDE.md) - Complete plantings API documentation
- [CLAUDE.md](./CLAUDE.md) - Project overview and structure
- [package.json](./package.json) - Available scripts and dependencies

## Contributing

When adding features:
1. Update the appropriate API file (`src/api/*.ts`)
2. Add server endpoints (`src/server/index.ts`)
3. Create/update web pages (`src/web/*.html`)
4. Update documentation (this file and LLM guides)
5. Test with both web interface and programmatic API

The system is designed to be simple and extensible - no complex build steps, no heavy frameworks, just clean TypeScript and HTMX!
