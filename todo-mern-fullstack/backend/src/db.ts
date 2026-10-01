/* =============================================================================
 * src/db.ts — MongoDB connection lifecycle
 * =============================================================================
 *
 * Mongoose is a thin ODM (Object-Document Mapper) layer on top of the official
 * MongoDB driver. It adds:
 *   • Schemas with validation
 *   • Model classes with typed instance / static methods
 *   • Middleware ("hooks") around save / find / etc.
 *
 * We only need two things in this file:
 *   • `connectToDatabase()`   — called once on startup
 *   • `disconnectFromDatabase()` — called during graceful shutdown
 *
 * Both are intentionally thin wrappers around Mongoose so the rest of the
 * app never imports `mongoose` just for connect/disconnect.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import mongoose from "mongoose";
import { config } from "./config/index.js";

export async function connectToDatabase(): Promise<void> {
    // `strictQuery` makes Mongoose ignore unknown fields in filter objects.
    // Prevents a whole class of typo bugs where you query `{ titel: "foo" }`
    // and silently match everything.
    mongoose.set("strictQuery", true);

    // `connect()` returns a promise that resolves once the first connection
    // is established. We await it so the HTTP server only starts listening
    // after we know the DB is reachable.
    await mongoose.connect(config.mongoUri);

    console.log(`[db] connected to ${redact(config.mongoUri)}`);
}

export async function disconnectFromDatabase(): Promise<void> {
    await mongoose.disconnect();
}

/**
 * Hide any `user:password@` segment of a connection string before logging.
 * Learning habit: never, ever print raw credentials to stdout.
 */
function redact(uri: string): string {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}
