// @ts-nocheck - Bun-specific code

/**
 * Simple Bun web server for plant management
 * Serves HTMX-based web interface and provides API endpoints
 */

import { addPlantSimple, type SimplePlantData } from "../api/plants.api.ts";
import { db } from "../db/client.ts";
import { plants, plantTags } from "../db/schema/index.ts";
import { eq, like, sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PORT = 3000;

/**
 * Serve static files from src/web directory
 */
function serveStatic(path: string): Response {
  const filePath = join(import.meta.dir, "../web", path);

  try {
    const file = readFileSync(filePath);
    const ext = path.split(".").pop();

    const contentTypes: Record<string, string> = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
    };

    return new Response(file, {
      headers: {
        "Content-Type": contentTypes[ext || "html"] || "text/plain",
      },
    });
  } catch (error) {
    return new Response("Not Found", { status: 404 });
  }
}

/**
 * Get all plants with their tags
 */
async function getAllPlants() {
  const allPlants = await db.select().from(plants).orderBy(plants.commonName);

  // Get tags for each plant
  const plantsWithTags = await Promise.all(
    allPlants.map(async (plant) => {
      const tags = await db
        .select({ tag: plantTags.tag })
        .from(plantTags)
        .where(eq(plantTags.plantId, plant.id));

      return {
        ...plant,
        tags: tags.map(t => t.tag),
      };
    })
  );

  return plantsWithTags;
}

/**
 * Search plants by query
 */
async function searchPlants(query: string) {
  const searchPattern = `%${query}%`;

  const results = await db
    .select()
    .from(plants)
    .where(
      sql`${plants.commonName} LIKE ${searchPattern} OR ${plants.variety} LIKE ${searchPattern}`
    )
    .orderBy(plants.commonName);

  // Get tags for each result
  const plantsWithTags = await Promise.all(
    results.map(async (plant) => {
      const tags = await db
        .select({ tag: plantTags.tag })
        .from(plantTags)
        .where(eq(plantTags.plantId, plant.id));

      return {
        ...plant,
        tags: tags.map(t => t.tag),
      };
    })
  );

  return plantsWithTags;
}

/**
 * Render a plant row for HTMX responses
 */
function renderPlantRow(plant: any): string {
  const tags = plant.tags?.join(", ") || "No tags";
  const lifecycle = plant.tags?.find((t: string) => ["annual", "perennial", "biennial"].includes(t)) || "Unknown";
  const purpose = plant.tags?.filter((t: string) => ["food", "flower", "medicinal"].includes(t)).join(", ") || "Unknown";

  return `
    <tr>
      <td>${plant.commonName}</td>
      <td>${plant.variety}</td>
      <td>${lifecycle}</td>
      <td>${purpose}</td>
      <td>
        <span class="tag-list">${tags}</span>
      </td>
      <td>${plant.metadata?.source || "N/A"}</td>
    </tr>
  `;
}

/**
 * Main server
 */
const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve static files
    if (path === "/" || path === "/index.html") {
      return serveStatic("index.html");
    }

    if (path === "/add-plant.html") {
      return serveStatic("add-plant.html");
    }

    if (path === "/style.css") {
      return serveStatic("style.css");
    }

    // API: Get all plants
    if (path === "/api/plants" && req.method === "GET") {
      const query = url.searchParams.get("q");

      const plantsData = query ? await searchPlants(query) : await getAllPlants();

      // Check if this is an HTMX request
      const isHtmx = req.headers.get("HX-Request") === "true";

      if (isHtmx) {
        // Return HTML for HTMX
        const html = plantsData.map(renderPlantRow).join("\n");
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      } else {
        // Return JSON for regular requests
        return new Response(JSON.stringify(plantsData, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // API: Add a plant
    if (path === "/api/plants" && req.method === "POST") {
      try {
        const contentType = req.headers.get("content-type");

        let plantData: SimplePlantData;

        if (contentType?.includes("application/json")) {
          // JSON request (programmatic)
          plantData = await req.json();
        } else {
          // Form data (web form)
          const formData = await req.formData();

          plantData = {
            commonName: formData.get("commonName") as string,
            variety: formData.get("variety") as string,
            scientificName: formData.get("scientificName") as string || undefined,
            daysToMaturity: formData.get("daysToMaturity") ? parseInt(formData.get("daysToMaturity") as string) : undefined,
            sunRequirement: formData.get("sunRequirement") as any || undefined,
            waterRequirement: formData.get("waterRequirement") as any || undefined,
            spacingInches: formData.get("spacingInches") ? parseInt(formData.get("spacingInches") as string) : undefined,
            plantingMethod: formData.get("plantingMethod") as any || undefined,
            seedDepthInches: formData.get("seedDepthInches") ? parseFloat(formData.get("seedDepthInches") as string) : undefined,
            germinationDays: formData.get("germinationDays") ? parseInt(formData.get("germinationDays") as string) : undefined,
            frostTolerance: formData.get("frostTolerance") as any || undefined,
            indoorStartWeeksBeforeFrost: formData.get("indoorStartWeeksBeforeFrost") ? parseInt(formData.get("indoorStartWeeksBeforeFrost") as string) : undefined,
            source: formData.get("source") as string || undefined,
            productId: formData.get("productId") as string || undefined,
            notes: formData.get("notes") as string || undefined,
            tags: (formData.get("tags") as string)?.split(",").map(t => t.trim()).filter(Boolean) || [],
          };
        }

        const plantId = await addPlantSimple(plantData);

        // Check if this is an HTMX request
        const isHtmx = req.headers.get("HX-Request") === "true";

        if (isHtmx) {
          // Return success message for HTMX
          return new Response(
            `<div class="success-message">✅ Plant added successfully: ${plantData.commonName} - ${plantData.variety}</div>`,
            {
              headers: {
                "Content-Type": "text/html",
                "HX-Trigger": "plantAdded", // Trigger event to refresh plant list
              },
            }
          );
        } else {
          // Return JSON for programmatic requests
          return new Response(
            JSON.stringify({ success: true, plantId, message: "Plant added successfully" }),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } catch (error: any) {
        const isHtmx = req.headers.get("HX-Request") === "true";

        if (isHtmx) {
          return new Response(
            `<div class="error-message">❌ Error: ${error.message}</div>`,
            {
              headers: { "Content-Type": "text/html" },
              status: 400,
            }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // API: Get plant stats
    if (path === "/api/stats" && req.method === "GET") {
      const totalPlants = await db.select({ count: sql`count(*)` }).from(plants);
      const allTags = await db.selectDistinct({ tag: plantTags.tag }).from(plantTags);

      const lifecycleCounts = await db
        .select({ tag: plantTags.tag, count: sql`count(*)` })
        .from(plantTags)
        .where(sql`${plantTags.tag} IN ('annual', 'perennial', 'biennial')`)
        .groupBy(plantTags.tag);

      const purposeCounts = await db
        .select({ tag: plantTags.tag, count: sql`count(*)` })
        .from(plantTags)
        .where(sql`${plantTags.tag} IN ('food', 'flower', 'medicinal')`)
        .groupBy(plantTags.tag);

      return new Response(
        JSON.stringify({
          totalPlants: totalPlants[0].count,
          totalTags: allTags.length,
          byLifecycle: lifecycleCounts,
          byPurpose: purposeCounts,
        }, null, 2),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 404
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🌱 Hillebrecht Garden Management Server`);
console.log(`📍 http://localhost:${PORT}`);
console.log(`\nEndpoints:`);
console.log(`  GET  /                    - Main plant list`);
console.log(`  GET  /add-plant.html      - Add plant form`);
console.log(`  GET  /api/plants          - Get all plants (JSON)`);
console.log(`  GET  /api/plants?q=query  - Search plants`);
console.log(`  POST /api/plants          - Add a plant`);
console.log(`  GET  /api/stats           - Database statistics`);
