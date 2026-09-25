/* ---------------------------------------------------------------------------
 * src/config.ts
 *
 * Central spot for every environment-driven constant in the app. `dotenv` runs
 * once here so any `import "./config.js"` (directly or transitively) picks up
 * variables from a local `.env` file.
 *
 * Sibling projects use different default ports so they can all run at once:
 *
 *   todo-node-api              3000
 *   todo-connect-api           3001
 *   todo-express-api           (varies)
 *   todo-node-api-express      3002
 *   todo-mongo-api-express     3003
 *   todo-mongo-mvc-express     3004   <-- this one
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import "dotenv/config";

const parsePort = (raw: string | undefined, fallback: number): number => {
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : fallback;
};

export const PORT: number = parsePort(process.env["PORT"], 3004);

// MongoDB connection string. Under NODE_ENV=test the test suite injects an
// in-memory server's URI at runtime, so the default here is a dev-friendly
// localhost fallback and never `throw`s on import.
export const MONGODB_URI: string =
    process.env["MONGODB_URI"] ?? "mongodb://127.0.0.1:27017/todo_mvc_dev";

// Set NODE_ENV=test to silence morgan + rate-limit during Vitest runs.
export const IS_TEST: boolean = process.env["NODE_ENV"] === "test";
