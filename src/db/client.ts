import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema/index.ts";

const sqlite = new Database("./data/hillebrecht.db");
export const db = drizzle(sqlite, { schema });
