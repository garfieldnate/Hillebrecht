# Hillebrecht Garden Management

A TypeScript-based garden seed inventory and seasonal planting plan management system built with Bun.

## Overview

This project provides a type-safe database system for managing:
- **Seed Inventory**: Comprehensive plant/seed information including planting timing, spacing, care requirements, and companion planting
- **Seasonal Planning**: Track what to plant each season with scheduling, location tracking, and results logging

## Features

### Frost-Relative Timing
All planting dates are stored relative to frost dates (last spring frost / first fall frost), making plant data location-independent. Calculate actual planting dates based on your local frost dates.

### Comprehensive Plant Data
- Identity and classification
- Soil requirements (richness, pH)
- Spacing for traditional rows and square-foot gardening
- Spring and fall planting windows
- Multiple harvest stages
- Companion planting relationships
- Care instructions and common issues

### Seasonal Planting Plans
- Track plantings by season and year
- Schedule management (indoor start, transplant, direct seed dates)
- Location tracking (bed, section, row)
- Status tracking (planned → seeds-started → planted → growing → harvesting → finished)
- Results logging for year-over-year learning

## Project Structure

```
hillebrecht/
├── src/
│   ├── types/
│   │   ├── common.types.ts      # Shared enums and base types
│   │   ├── plant.types.ts       # Plant interface and related types
│   │   └── planting.types.ts    # PlannedPlanting interface
│   └── data/
│       ├── plants.db.ts         # Plant database array + helper functions
│       └── plantings.db.ts      # PlannedPlanting database array + helpers
├── tsconfig.json
├── package.json
└── README.md
```

## Usage

### Working with the Plant Database

```typescript
import {
  plantsDatabase,
  getPlantById,
  searchPlants,
  getPlantsByTag,
} from "./src/data/plants.db.ts";

// Get all plants
console.log(plantsDatabase);

// Find a specific plant
const tomato = getPlantById("tomato-cherokee-purple");

// Search by name
const lettuces = searchPlants("lettuce");

// Find by tag
const coolSeasonCrops = getPlantsByTag("cool-season");
```

### Working with Planting Plans

```typescript
import {
  plantingsDatabase,
  getPlantingsBySeason,
  getCurrentSeasonPlantings,
  addPlanting,
} from "./src/data/plantings.db.ts";
import { Season, PlantingStatus } from "./src/types/common.types.ts";

// Get current season plantings
const current = getCurrentSeasonPlantings();

// Get specific season
const spring2026 = getPlantingsBySeason(2026, Season.Spring);

// Add a new planting
addPlanting({
  id: "spring-2026-tomato-01",
  plantId: "tomato-cherokee-purple",
  plantName: "Tomato",
  variety: "Cherokee Purple",
  year: 2026,
  season: Season.Spring,
  schedule: {
    indoorStartDate: "2026-03-15",
    transplantDate: "2026-05-01",
  },
  location: {
    bed: "raised-bed-01",
    section: "north",
  },
  quantity: {
    planned: 6,
    unit: "plants",
  },
  status: PlantingStatus.Planned,
});
```

## Type Checking

Run TypeScript type checking:

```bash
bun run type-check
```

## Example Plants

The database includes two example plants to demonstrate the structure:

1. **Cherokee Purple Tomato**: Indeterminate heirloom variety, demonstrates transplant timing, companion planting, and care requirements
2. **Black Seeded Simpson Lettuce**: Cool-season crop, demonstrates succession planting, multiple harvest stages, and cut-and-come-again harvesting

## Adding Your Own Plants

Edit `src/data/plants.db.ts` and add plants to the `plantsDatabase` array following the `Plant` interface structure defined in `src/types/plant.types.ts`.

## Future Extensions

The type system supports future features:
- Garden bed configuration database
- Automatic schedule generation from frost dates
- Space planning algorithms
- Crop rotation tracking
- Harvest logging with quantities
- Photo attachments

## Requirements

- [Bun](https://bun.sh) runtime and package manager
- TypeScript 5.0+

## License

MIT
