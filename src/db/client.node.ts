/**
 * Node.js-compatible database client for migrations and seed scripts
 * Uses better-sqlite3 instead of bun:sqlite
 */
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema/index.ts";

const sqlite = new Database("./data/hillebrecht.db");
export const db = drizzle(sqlite, { schema });
