# Claude Code Notes - Hillebrecht Garden Management

## Project Overview

This is a TypeScript-based garden seed inventory and seasonal planting plan management system built for use with Bun. The database uses frost-relative timing to make plant data location-independent.

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
├── package.json                  # Using pnpm as package manager
├── tsconfig.json
└── README.md
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

3. **Add descriptive tags**
   - Plant type: `"annual"`, `"perennial"`, `"biennial"`
   - Season: `"cool-season"`, `"warm-season"`
   - Special characteristics: `"heirloom"`, `"drought-tolerant"`, `"pollinator-friendly"`
   - Growing method: `"succession-plant"`, `"cut-and-come-again"`
   - Hardiness zones: `"zones-3-9"`, `"zone-4"`

4. **Example complete tag set:**
   ```typescript
   tags: [
     "perennial",
     "zones-3-9",
     "freeheirloomseeds.org",
     "#ASP1",
     "long-lived"
   ]
   ```

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
tags: ["heirloom", "indeterminate", "baker-creek", "#TOM12"]
metadata: { source: "Baker Creek Heirloom Seeds" }

// After:
tags: ["heirloom", "indeterminate", "baker-creek", "#TOM12", "johnny-seeds", "#JS-456"]
metadata: { source: "Baker Creek Heirloom Seeds, Johnny's Selected Seeds" }
notes: "... Also available from Johnny's Selected Seeds (#JS-456)..."
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

## Database Helper Functions

### plants.db.ts
- `getPlantById(id: string)` - Find specific plant
- `searchPlants(query: string)` - Search by name/variety
- `getPlantsByTag(tag: string)` - Filter by tag
- `getAllTags()` - List all unique tags

### plantings.db.ts
- `getPlantingsBySeason(year, season)` - Season filter
- `getPlantingsByStatus(status)` - Status filter
- `getPlantingsByBed(bedId)` - Location filter
- `getCurrentSeasonPlantings()` - Auto-detect current season
- `getUpcomingPlantings(daysAhead)` - Find tasks due soon
- `addPlanting(planting)` - Add new planting
- `updatePlanting(id, updates)` - Update existing
- `deletePlanting(id)` - Remove planting

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

- **Total plants**: 60
  - 2 original examples
  - 57 from freeheirloomseeds.org
  - 1 Beit Alpha cucumber
- **Plants with special germination requirements**: 8
  - Asparagus (2 varieties) - cold stratification + soaking
  - Yarrow - cold stratification + light
  - Lovage - cold stratification (optional)
  - Sweet William (2 varieties) - cold stratification (optional) + light
  - Parsley (2 varieties) - warm water soaking

## Important Reminders

1. **Frost-relative timing** is key - never use specific calendar dates in plant data
2. **Germination requirements** need to be tracked for scheduling
3. **Stratification** must start weeks/months before planting
4. **Use pnpm** as the package manager (not npm or bun)
5. **Type safety** - always run type-check after changes
6. **Duplicate prevention** - check for existing varieties before adding
7. **Tag consistency** - use lowercase with hyphens for distributor names

## Future Enhancements

The type system supports (but not yet implemented):
- Garden bed configuration database
- Automatic schedule generation from frost dates
- Space planning algorithms
- Crop rotation tracking
- Harvest logging with quantities
- Photo attachments

## Useful Commands

```bash
# Type checking
pnpm run type-check

# Count plants in database
grep -c "^  {$" src/data/plants.db.ts

# Search for specific plants
grep -i "commonName.*tomato" src/data/plants.db.ts

# Find plants from specific source
grep -i "freeheirloomseeds.org" src/data/plants.db.ts
```
