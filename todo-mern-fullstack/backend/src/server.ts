/* =============================================================================
 * src/server.ts — process entry point
 * =============================================================================
 *
 * This is the very first file to run when `npm run dev` / `npm start`
 * executes. Its job is tiny but important:
 *
 *   1. Open the DB connection (fail fast if the DB is down).
 *   2. Build the Express app via `createApp()`.
 *   3. Call `.listen()` to bind the HTTP socket.
 *   4. Wire up graceful shutdown so `Ctrl+C` lets in-flight requests
 *      finish and closes the Mongo connection cleanly.
 *
 * Separation of concerns:
 *   • `app.ts` builds and configures the Express app (easy to unit-test).
 *   • `server.ts` is the only file that talks to the OS (ports, signals).
 *
 * Read next:
 *   1. src/app.ts                    -- builds the Express app
 *   2. src/routes/todos.ts           -- URL → controller mapping
 *   3. src/controllers/todos.ts      -- CRUD handlers
 *   4. src/models/Todo.ts            -- Mongoose schema
 *   5. src/db.ts                     -- Mongo connect / disconnect
 *   6. src/middleware/errorHandler.ts
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectToDatabase, disconnectFromDatabase } from "./db.js";

async function main(): Promise<void> {
    await connectToDatabase();

    const app = createApp();

    const server = app.listen(config.port, () => {
        console.log(
            `[server] API listening on http://localhost:${config.port}`,
        );
        console.log(`[server] Health:  http://localhost:${config.port}/health`);
        console.log(
            `[server] Todos:   http://localhost:${config.port}/api/todos`,
        );
        console.log(
            `[server] Docs:    http://localhost:${config.port}/api-docs`,
        );
    });

    // -----------------------------------------------------------------
    // Graceful shutdown — SIGINT (Ctrl+C) in dev, SIGTERM from Docker.
    // We stop accepting new requests, wait for the current ones, then
    // close the Mongo connection.
    // -----------------------------------------------------------------
    const shutdown = (signal: string): void => {
        console.log(`\n[server] ${signal} received, shutting down...`);
        server.close(async () => {
            try {
                await disconnectFromDatabase();
                console.log("[server] clean shutdown complete.");
                process.exit(0);
            } catch (err) {
                console.error("[server] shutdown error:", err);
                process.exit(1);
            }
        });
        // Safety net: force exit if requests hang.
        setTimeout(() => {
            console.error("[server] forced exit after 10s.");
            process.exit(1);
        }, 10_000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err: unknown) => {
    console.error("[server] fatal startup error:", err);
    process.exit(1);
});
