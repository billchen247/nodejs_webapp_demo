/* =============================================================================
 * src/config/index.ts — typed environment configuration
 * =============================================================================
 *
 * One of the first things every real-world Node application needs: a single
 * place that reads environment variables, validates them, and exposes them
 * as a typed object. Scatter `process.env.PORT` calls around the codebase
 * and you'll regret it the first time someone misspells a variable.
 *
 * Steps:
 *   1. Call `dotenv.config()` so a local `.env` file (if present) is loaded
 *      into `process.env`. In production the host (Docker, Heroku, Kubernetes,
 *      etc.) usually injects env vars directly, so `.env` only matters for
 *      local dev.
 *   2. Pull out each variable, falling back to a sensible default where safe.
 *   3. Export a frozen object so no code accidentally mutates config at
 *      runtime.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import "dotenv/config"; // side-effect import: populates process.env from .env

// `process.env.X` is `string | undefined`. For required values we throw loudly
// if they're missing — "fail fast" is a nicer debugging experience than a
// cryptic error 20 lines later.
function required(name: string, fallback?: string): string {
    const value = process.env[name] ?? fallback;
    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const config = Object.freeze({
    port: Number(process.env.PORT ?? 4000),

    nodeEnv: process.env.NODE_ENV ?? "development",

    mongoUri: required(
        "MONGODB_URI",
        // Local-dev default so a brand-new clone of the repo "just works".
        "mongodb://localhost:27017/todo_mern_fullstack",
    ),

    // CORS allow-list — the React dev server's URL. In production you would
    // set this to the deployed frontend domain.
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
});

export type AppConfig = typeof config;
