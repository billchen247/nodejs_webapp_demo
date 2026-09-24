/* =============================================================================
 * src/server.ts — entry point
 * =============================================================================
 *
 * The Express application is constructed in `src/app.ts`. This file:
 *
 *   1. Opens the MongoDB connection (`connectToDatabase()`).
 *   2. Starts the HTTP server on PORT.
 *   3. Wires up graceful shutdown: on SIGINT / SIGTERM, it stops accepting
 *      new connections, waits for in-flight requests, then closes Mongo.
 *
 * Read next:
 *   1. src/app.ts               -- builds the Express app
 *   2. src/routes/todos.ts      -- the /api/todos router
 *   3. src/controllers/todos.ts -- request handlers per verb
 *   4. src/schemas/todos.ts     -- Zod validation
 *   5. src/models/todos.ts      -- the Mongoose model
 *   6. src/db.ts                -- Mongo connect / disconnect
 *   7. src/middleware/errors.ts -- notFound + errorHandler
 *
 * Sister projects for comparison:
 *   ../todo-node-api            raw http, no framework
 *   ../todo-connect-api         Connect middleware
 *   ../todo-express-api         Express 4
 *   ../todo-node-api-express    Express 5 + TypeScript + JSON file
 * ===========================================================================
 * @author Bill Chen
 */

import { createApp } from "./app.js";
import { PORT } from "./config.js";
import { connectToDatabase, disconnectFromDatabase } from "./db.js";

async function main(): Promise<void> {
    // Fail fast if the DB is unreachable — no point binding a socket if we
    // can't answer a request.
    await connectToDatabase();

    const app = createApp();

    const server = app.listen(PORT, () => {
        const addr = server.address();
        const actualPort =
            typeof addr === "object" && addr !== null ? addr.port : PORT;
        console.log(`Todo API (Express 5 + TS + Mongo) listening on http://localhost:${actualPort}`);
        console.log(`Home page:   http://localhost:${actualPort}/`);
        console.log(`API root:    http://localhost:${actualPort}/api/todos`);
        console.log(`Swagger UI:  http://localhost:${actualPort}/api-docs/`);
    });

    // Graceful shutdown — SIGINT (Ctrl+C) and SIGTERM (kill/Docker) should let
    // in-flight requests finish and close the DB connection before exit.
    const shutdown = (signal: string) => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        server.close(async () => {
            console.log("HTTP server closed.");
            try {
                await disconnectFromDatabase();
                console.log("MongoDB connection closed.");
            } catch (err) {
                console.error("Error while closing MongoDB:", err);
            }
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
}

main().catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
});
