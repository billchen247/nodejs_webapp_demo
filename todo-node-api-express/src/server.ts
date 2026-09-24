/* =============================================================================
 * src/server.ts — entry point
 * =============================================================================
 *
 * The Express application is constructed in `src/app.ts`. This file just
 * starts it listening. Keeping the entry point tiny is a common convention:
 *
 *   - tests can import `createApp()` from `./app.js` and pick their own port
 *     (or use supertest with no listening socket at all),
 *   - the "how the process runs" concern stays separate from the "how the
 *     app is wired up" concern.
 *
 * Read next:
 *   1. src/app.ts              -- builds the Express app
 *   2. src/routes/todos.ts     -- the /api/todos router
 *   3. src/controllers/todos.ts -- request handlers per verb
 *   4. src/schemas/todos.ts    -- Zod validation
 *   5. src/models/todos.ts     -- the JSON-file "database"
 *   6. src/middleware/errors.ts -- notFound + errorHandler
 *
 * Sister projects for comparison:
 *   ../todo-node-api      raw http, no framework
 *   ../todo-connect-api   Connect (Express's minimalist ancestor)
 * ===========================================================================
 * @author Bill Chen
 */

import { createApp } from "./app.js";
import { PORT } from "./config.js";

const app = createApp();

const server = app.listen(PORT, () => {
    const addr = server.address();
    const actualPort =
        typeof addr === "object" && addr !== null ? addr.port : PORT;
    console.log(`Todo API (Express 5 + TS) listening on http://localhost:${actualPort}`);
    console.log(`Home page:   http://localhost:${actualPort}/`);
    console.log(`API root:    http://localhost:${actualPort}/api/todos`);
    console.log(`Students API: http://localhost:${actualPort}/api/students`);
    console.log(`Swagger UI:  http://localhost:${actualPort}/api-docs/`);
});

// Graceful shutdown — SIGINT (Ctrl+C) and SIGTERM (from kill/Docker) should
// let in-flight requests finish before Node exits.
const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
    });
    // Force exit after 10s if requests hang.
    setTimeout(() => {
        console.error("Forcing shutdown after 10s.");
        process.exit(1);
    }, 10_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
