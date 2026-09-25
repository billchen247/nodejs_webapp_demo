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
 * IMPORTANT — `connectToDatabase()` runs BEFORE `createApp()`. The session
 * store (connect-mongo) reuses Mongoose's live MongoClient at app-construct
 * time, so the connection must be up first. Tests follow the same order.
 *
 * Read next:
 *   1. src/app.ts                    -- Express + view engine + session + middleware
 *   2. src/routes/auth.ts            -- /signup, /login, /logout
 *   3. src/routes/projects.ts        -- /projects + nested /tasks
 *   4. src/routes/tasks.ts           -- /projects/:pid/tasks CRUD
 *   5. src/routes/users.ts           -- /users directory + /users/me profile edit
 *   6. src/routes/todos.ts           -- legacy /todos demo (open access)
 *   7. src/controllers/…             -- one file per resource
 *   8. src/schemas/…                 -- Zod input schemas
 *   9. src/models/{user,project,task,todo}.ts   -- Mongoose schemas + Models
 *  10. src/middleware/{auth,flash,errors}.ts    -- request-time concerns
 *  11. src/db.ts                     -- Mongo connect / disconnect
 *  12. views/                        -- EJS templates
 *
 * Sister projects for comparison:
 *   ../todo-node-api            raw http, no framework
 *   ../todo-connect-api         Connect middleware
 *   ../todo-express-api         Express 4
 *   ../todo-node-api-express    Express 5 + TypeScript + JSON file
 *   ../todo-mongo-api-express   Express 5 + TS + Mongo, JSON REST API
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
        console.log(`Task Manager (Express 5 + TS + Mongo + EJS) listening on http://localhost:${actualPort}`);
        console.log(`Home page:      http://localhost:${actualPort}/`);
        console.log(`Sign up:        http://localhost:${actualPort}/signup`);
        console.log(`Projects:       http://localhost:${actualPort}/projects   (requires login)`);
        console.log(`Legacy todos:   http://localhost:${actualPort}/todos`);
    });

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
