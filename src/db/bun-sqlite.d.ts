/**
 * Type declarations for bun:sqlite
 * Bun's built-in SQLite module
 */
declare module "bun:sqlite" {
  export class Database {
    constructor(filename: string, options?: any);
    query(sql: string): any;
    run(sql: string): any;
    close(): void;
  }
}
