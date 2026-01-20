# LLM Guide: Adding Plants to Hillebrecht Garden Database

## Quick Start

When asked to add a plant to the database, follow this process:

1. **Research the plant** - Gather information from reliable horticultural sources
2. **Use the API** - Call `addPlantSimple()` with the data
3. **Validate** - Ensure the plant was added successfully

## Research Checklist

When researching a plant, try to find these details (in order of importance):

### ✅ REQUIRED
- **Common Name** - e.g., "Tomato"
- **Variety** - e.g., "Cherokee Purple"

### ⭐ HIGHLY RECOMMENDED
- **Days to Maturity** - Average days from planting to harvest
- **Spacing** - Inches between plants
- **Sun Requirement** - full-sun, partial-sun, partial-shade, or full-shade
- **Water Requirement** - low, moderate, or high
- **Planting Method** - direct-seed, transplant, or either
- **Frost Tolerance** - tender, half-hardy, hardy, or very-hardy
- **Tags** - Lifecycle (annual/perennial/biennial), purpose (food/flower/medicinal), characteristics

### 📝 NICE TO HAVE
- Scientific Name
- Seed Depth (inches)
- Germination Days
- Indoor Start Timing (weeks before last frost)
- Soil pH range
- Source/Distributor name
- Product ID from distributor
- Additional notes

## Using the API

### Method 1: Minimal (Just the essentials)

```typescript
import { addPlantSimple } from "./src/api/plants.api.ts";

await addPlantSimple({
  commonName: "Basil",
  variety: "Genovese",
  tags: ["annual", "food", "herb"]
});
```

### Method 2: Detailed (With research)

```typescript
await addPlantSimple({
  // Required
  commonName: "Tomato",
  variety: "San Marzano",

  // Identification
  scientificName: "Solanum lycopersicum",

  // Growing requirements
  daysToMaturity: 80,
  sunRequirement: "full-sun",
  waterRequirement: "moderate",
  spacingInches: 24,

  // Planting
  plantingMethod: "transplant",
  seedDepthInches: 0.25,
  germinationDays: 7,
  frostTolerance: "tender",
  indoorStartWeeksBeforeFrost: 6,

  // Source
  source: "Baker Creek Heirloom Seeds",
  productId: "#TOM45",

  // Tags
  tags: ["annual", "food", "determinate", "sauce-tomato", "heirloom"],

  // Notes
  notes: "Classic Italian paste tomato. Excellent for sauces and canning."
});
```

## Common Tag Conventions

### Lifecycle (pick ONE)
- `annual` - Completes life cycle in one season
- `perennial` - Lives multiple years
- `biennial` - Completes life cycle in two years

### Purpose (pick AT LEAST ONE, can have multiple)
- `food` - Edible (vegetables, fruits, herbs)
- `flower` - Ornamental flowers
- `medicinal` - Medicinal properties

### Characteristics (optional, add as many as relevant)
- `heirloom` - Heirloom variety
- `cool-season` - Grows best in cool weather
- `warm-season` - Needs warm temperatures
- `drought-tolerant` - Low water needs
- `pollinator-friendly` - Attracts pollinators
- `succession-plant` - Good for successive plantings
- `cut-and-come-again` - Harvest and regrow
- Plant family: `brassica`, `nightshade`, `allium`, `legume`, etc.

Always include:
- Distributor name (e.g., `baker-creek`, `johnny-seeds`)
- Product ID if available (e.g., `#TOM45`)

## Research Sources

Good places to find plant information:

1. **Seed Company Websites**
   - Baker Creek Heirloom Seeds
   - Johnny's Selected Seeds
   - Seed Savers Exchange
   - Burpee
   - High Mowing Seeds

2. **University Extensions**
   - State agricultural extension services
   - Land-grant university resources

3. **Gardening References**
   - RHS (Royal Horticultural Society)
   - Missouri Botanical Garden
   - USDA Plants Database

## Examples by Plant Type

### Vegetable (Annual)
```typescript
await addPlantSimple({
  commonName: "Lettuce",
  variety: "Buttercrunch",
  daysToMaturity: 55,
  sunRequirement: "partial-sun",
  waterRequirement: "moderate",
  spacingInches: 8,
  plantingMethod: "either",
  frostTolerance: "hardy",
  directSeedWeeksFromFrost: -2, // Can plant 2 weeks before last frost
  tags: ["annual", "food", "cool-season", "succession-plant"]
});
```

### Herb (Annual)
```typescript
await addPlantSimple({
  commonName: "Basil",
  variety: "Sweet Genovese",
  scientificName: "Ocimum basilicum",
  daysToMaturity: 60,
  sunRequirement: "full-sun",
  waterRequirement: "moderate",
  spacingInches: 12,
  plantingMethod: "either",
  frostTolerance: "tender",
  indoorStartWeeksBeforeFrost: 6,
  tags: ["annual", "food", "herb", "warm-season", "italian"]
});
```

### Perennial
```typescript
await addPlantSimple({
  commonName: "Asparagus",
  variety: "Mary Washington",
  daysToMaturity: 730, // 2 years to first harvest
  sunRequirement: "full-sun",
  waterRequirement: "moderate",
  spacingInches: 18,
  plantingMethod: "transplant",
  frostTolerance: "very-hardy",
  tags: ["perennial", "food", "long-lived"]
});
```

### Flower
```typescript
await addPlantSimple({
  commonName: "Zinnia",
  variety: "Benary's Giant Mix",
  daysToMaturity: 60,
  sunRequirement: "full-sun",
  waterRequirement: "moderate",
  spacingInches: 12,
  plantingMethod: "direct-seed",
  frostTolerance: "tender",
  tags: ["annual", "flower", "pollinator-friendly", "cut-flower"]
});
```

## Error Handling

If you get an error:

1. **"Plant already exists"** - Check if there's a similar variety already in the database
2. **Validation errors** - Make sure required fields (commonName, variety) are provided
3. **Type errors** - Ensure enums match exactly (e.g., "full-sun" not "Full Sun")

## Tips for Effective Research

1. **Start with the seed packet** - Most seed companies provide comprehensive growing information
2. **Use standard horticultural terms** - Stick to industry-standard terminology
3. **When in doubt, use defaults** - The API provides sensible defaults for missing data
4. **Be consistent with naming** - Use the variety name as listed by the distributor
5. **Add the source** - Always include where the seeds came from (distributor + product ID)

## Testing Your Addition

After adding a plant, you can verify it was added:

```typescript
import { db } from "./src/db/client.ts";
import { plants } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

// Check if plant exists
const result = await db
  .select()
  .from(plants)
  .where(eq(plants.id, "tomato-san-marzano"))
  .limit(1);

console.log(result.length > 0 ? "✅ Plant added" : "❌ Plant not found");
```

## Web Interface Alternative

Instead of using the API directly, users can add plants through the web interface:

1. Start the server: `bun src/server/index.ts`
2. Open browser to `http://localhost:3000`
3. Click "Add Plant"
4. Fill in the form
5. Submit

The web form uses the same `addPlantSimple()` function behind the scenes.

## Full API Reference

See `src/api/plants.api.ts` for the complete TypeScript interface definition and detailed documentation on all available fields.
