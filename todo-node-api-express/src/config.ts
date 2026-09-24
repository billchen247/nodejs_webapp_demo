/* ---------------------------------------------------------------------------
 * src/config.ts
 *
 * Central spot for every environment-driven constant in the app. Keeping this
 * in one file (instead of sprinkling `process.env.FOO` calls across the
 * codebase) makes it easy to:
 *
 *   - see everything the app depends on for configuration in one place,
 *   - default sensibly when a variable is missing,
 *   - stub values in tests via environment variables.
 *
 * The three sister projects (`../todo-node-api`, `../todo-connect-api`,
 * this one) all default to different ports so they can run side-by-side:
 *
 *   todo-node-api      3000
 *   todo-connect-api   3001
 *   todo-node-api-express (this)  3002
 * -------------------------------------------------------------------------*/

const parsePort = (raw: string | undefined, fallback: number): number => {
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : fallback;
};

export const PORT: number = parsePort(process.env["PORT"], 3002);

// The origin our future React dev server will run on. In a real project this
// would come from an env var; hard-coding keeps the CORS story concrete for
// learners.
export const ALLOWED_ORIGIN: string =
    process.env["ALLOWED_ORIGIN"] ?? "http://localhost:5173";

// Set NODE_ENV=test to silence morgan request logging during Vitest runs.
export const IS_TEST: boolean = process.env["NODE_ENV"] === "test";
