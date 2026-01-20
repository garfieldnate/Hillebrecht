# LLM Guide: Adding Plantings to Hillebrecht Garden Database

## Quick Start

A "planting" is a specific instance of growing a plant variety in your garden. It tracks:
- **What** you're growing (plant variety)
- **Where** it's located (bed, row, position)
- **When** it was planted and harvested
- **How much** you're growing (quantity)
- **Status** throughout the season

## Adding a Planting

### Minimal Example

Only plantId, year, and season are required:

```typescript
import { addPlantingSimple } from "./src/api/plantings.api.ts";

await addPlantingSimple({
  plantId: "tomato-cherokee-purple",
  year: 2026,
  season: "spring",
  quantity: 6
});
```

### With Location

```typescript
await addPlantingSimple({
  plantId: "lettuce-buttercrunch",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-1",
  location: "North side, partial shade",
  row: 2,
  quantity: 12
});
```

### With Full Schedule

```typescript
await addPlantingSimple({
  plantId: "tomato-san-marzano",
  year: 2026,
  season: "spring",
  bedId: "garden-bed-a",
  location: "South side, full sun",
  seedsPlanted: 12,
  quantity: 8,
  indoorStartDate: "2026-03-15",
  transplantDate: "2026-05-20",
  harvestStartDate: "2026-07-15",
  status: "seeds-started",
  notes: "Started indoors under grow lights"
});
```

## Seasons

- **spring** - March - May
- **summer** - June - August
- **fall** - September - November
- **winter** - December - February

## Status Values

Track progress through the season:

- **planned** - Intending to plant (default)
- **seeds-started** - Seeds sown (indoors or outdoors)
- **planted** - In the ground/container
- **growing** - Actively growing
- **harvesting** - Producing crops
- **finished** - Season complete
- **failed** - Didn't work out
- **skipped** - Decided not to plant

## Location Information

### bedId
Unique identifier for the garden bed:
- `raised-bed-1`, `raised-bed-2`
- `garden-bed-a`, `garden-bed-b`
- `container-1`, `container-patio`
- `greenhouse-bench-1`

### location
Human-readable description:
- "North side, partial shade"
- "East end near the fence"
- "Center bed, full sun"
- "By the compost bin"

### row
Row number within the bed (if applicable):
- `1`, `2`, `3`, etc.

### position
Position within the row:
- "west end"
- "middle"
- "every 12 inches"

## Updating Status

As your plants progress:

```typescript
import { updatePlantingStatus } from "./src/api/plantings.api.ts";

// Seeds germinated
await updatePlantingStatus("tomato-cherokee-purple-2026-spring-bed-a", "planted", {
  directSeedDate: "2026-05-01"
});

// Plants are growing
await updatePlantingStatus("tomato-cherokee-purple-2026-spring-bed-a", "growing");

// Harvest starts
await updatePlantingStatus("tomato-cherokee-purple-2026-spring-bed-a", "harvesting", {
  harvestStartDate: "2026-07-15"
});

// Season complete
await updatePlantingStatus("tomato-cherokee-purple-2026-spring-bed-a", "finished", {
  harvestEndDate: "2026-09-30",
  removalDate: "2026-10-05"
});
```

## Logging Harvests

Track what you harvest:

```typescript
import { logHarvest } from "./src/api/plantings.api.ts";

await logHarvest("tomato-cherokee-purple-2026-spring-bed-a", {
  date: "2026-07-15",
  amount: "5",
  unit: "lbs",
  notes: "First major harvest, excellent flavor"
});

await logHarvest("tomato-cherokee-purple-2026-spring-bed-a", {
  date: "2026-07-22",
  amount: "8",
  unit: "lbs",
  notes: "Peak production"
});
```

## Examples by Plant Type

### Transplanted Vegetables (Tomatoes, Peppers)

```typescript
await addPlantingSimple({
  plantId: "pepper-california-wonder",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-2",
  location: "South side, full sun",
  row: 1,
  seedsPlanted: 8,
  quantity: 6,
  indoorStartDate: "2026-03-01",
  transplantDate: "2026-05-20",
  status: "seeds-started",
  notes: "Need heat mat for germination"
});
```

### Direct Seeded (Carrots, Beans)

```typescript
await addPlantingSimple({
  plantId: "carrot-danvers-126",
  year: 2026,
  season: "spring",
  bedId: "garden-bed-b",
  location: "Row 3",
  quantity: 100,  // Estimated plants from seed row
  directSeedDate: "2026-04-15",
  harvestStartDate: "2026-07-01",
  status: "planted",
  notes: "Thinned to 2 inches apart"
});
```

### Succession Planting

Plant the same variety multiple times:

```typescript
// First planting
await addPlantingSimple({
  plantId: "lettuce-buttercrunch",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-1",
  row: 1,
  quantity: 12,
  directSeedDate: "2026-04-01"
});

// Second planting (2 weeks later)
await addPlantingSimple({
  plantId: "lettuce-buttercrunch",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-1",
  row: 2,
  quantity: 12,
  directSeedDate: "2026-04-15"
});

// Third planting (2 weeks later)
await addPlantingSimple({
  plantId: "lettuce-buttercrunch",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-1",
  row: 3,
  quantity: 12,
  directSeedDate: "2026-05-01"
});
```

### Perennials

Track year after year:

```typescript
// First year planting
await addPlantingSimple({
  plantId: "asparagus-mary-washington",
  year: 2026,
  season: "spring",
  bedId: "perennial-bed",
  location: "North end",
  quantity: 25,
  transplantDate: "2026-04-20",
  status: "growing",
  notes: "No harvest for 2 years - establishing crowns"
});

// Second year (update status, no harvest yet)
await addPlantingSimple({
  plantId: "asparagus-mary-washington",
  year: 2027,
  season: "spring",
  bedId: "perennial-bed",
  location: "North end",
  quantity: 25,
  status: "growing",
  notes: "Year 2 - still establishing, light harvest only"
});

// Third year (full production)
await addPlantingSimple({
  plantId: "asparagus-mary-washington",
  year: 2028,
  season: "spring",
  bedId: "perennial-bed",
  location: "North end",
  quantity: 25,
  status: "harvesting",
  harvestStartDate: "2028-04-15",
  notes: "Year 3 - full production!"
});
```

### Container Gardens

```typescript
await addPlantingSimple({
  plantId: "tomato-cherry-sunsugar",
  year: 2026,
  season: "spring",
  bedId: "container-patio-1",
  location: "South patio, full sun",
  quantity: 1,
  transplantDate: "2026-05-15",
  status: "growing",
  notes: "10-gallon fabric pot with cage support"
});
```

## Companion Planting

Track beneficial plant combinations:

```typescript
await addPlantingSimple({
  plantId: "tomato-cherokee-purple",
  year: 2026,
  season: "spring",
  bedId: "raised-bed-1",
  quantity: 6,
  companionPlantIds: ["basil-genovese", "marigold-french"],
  notes: "Basil at base of plants, marigolds at bed edges"
});
```

## Web Interface

Manage plantings through the web interface:

1. Start server: `bun src/server/index.ts`
2. Visit `http://localhost:3000/plantings.html`
3. Click "+ Add Planting"
4. Fill in the form

## Tips

1. **Use consistent bed IDs** - Pick a naming scheme and stick to it
2. **Track everything** - Even failed plantings teach you something
3. **Note quantities** - Helps plan future years
4. **Record dates** - Learn your garden's timing
5. **Log harvests** - See what's productive
6. **Add notes** - Observations are valuable
7. **Plan succession** - Keep harvests coming
8. **Track companions** - Learn what works together

## Common Workflows

### Starting Seeds Indoors

```typescript
// When starting seeds
await addPlantingSimple({
  plantId: "tomato-san-marzano",
  year: 2026,
  season: "spring",
  bedId: "garden-bed-a",
  seedsPlanted: 12,
  quantity: 8,  // Expecting 8 to transplant
  indoorStartDate: "2026-03-15",
  status: "seeds-started"
});

// After transplanting
await updatePlantingStatus("tomato-san-marzano-2026-spring-garden-bed-a", "planted", {
  transplantDate: "2026-05-20"
});
```

### Tracking Through Season

```typescript
// Initial planting
await addPlantingSimple({
  plantId: "cucumber-marketmore",
  year: 2026,
  season: "summer",
  bedId: "trellis-bed",
  quantity: 4,
  directSeedDate: "2026-06-01",
  status: "planted"
});

// Growing well
await updatePlantingStatus("cucumber-marketmore-2026-summer-trellis-bed", "growing");

// First harvest
await updatePlantingStatus("cucumber-marketmore-2026-summer-trellis-bed", "harvesting", {
  harvestStartDate: "2026-07-05"
});

// Log harvests
await logHarvest("cucumber-marketmore-2026-summer-trellis-bed", {
  date: "2026-07-05",
  amount: "3",
  unit: "lbs"
});

// End of season
await updatePlantingStatus("cucumber-marketmore-2026-summer-trellis-bed", "finished", {
  harvestEndDate: "2026-08-30",
  removalDate: "2026-09-05",
  notes: "Powdery mildew at end of season - earlier removal next year"
});
```
