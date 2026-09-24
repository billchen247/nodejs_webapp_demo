/* ---------------------------------------------------------------------------
 * src/db.ts
 *
 * Everything that touches the MongoDB connection lifecycle lives here:
 *
 *   * `connectToDatabase(uri?)` — opens Mongoose's default connection.
 *   * `disconnectFromDatabase()` — closes it cleanly on shutdown.
 *
 * `mongoose` itself keeps a single default connection under the hood, which
 * every `Model` in the app uses transparently. That's what lets the models in
 * `src/models/` stay agnostic about *when* the connection was opened.
 *
 * Why a wrapper instead of `mongoose.connect()` inline in server.ts?
 *   * Tests can pass their own URI (from `mongodb-memory-server`) without
 *     touching env vars.
 *   * Retries, logging, and connection options are declared in one place.
 *   * `disconnectFromDatabase()` mirrors the `close()` step of graceful
 *     shutdown so nothing leaks between test files.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose from "mongoose";
import { MONGODB_URI, IS_TEST } from "./config.js";

// Fail fast on typos in schemas — Mongoose 7+ default, but explicit is nicer.
mongoose.set("strictQuery", true);

export async function connectToDatabase(uri?: string): Promise<void> {
    const target = uri ?? MONGODB_URI;

    // Sensible driver defaults; feel free to tune per environment.
    await mongoose.connect(target, {
        serverSelectionTimeoutMS: 5_000,
        // Auto-index in dev/test only. In production you usually manage indexes
        // out-of-band because building them can block writes on a hot table.
        autoIndex: !IS_TEST ? process.env["NODE_ENV"] !== "production" : true,
    });

    if (!IS_TEST) {
        console.log(`MongoDB connected: ${redactUri(target)}`);
    }
}

export async function disconnectFromDatabase(): Promise<void> {
    // `mongoose.disconnect()` closes every connection Mongoose opened; that's
    // just the default one in our case.
    await mongoose.disconnect();
}

// Hide credentials before we print the URI to the console.
function redactUri(uri: string): string {
    try {
        const u = new URL(uri);
        if (u.password) u.password = "***";
        if (u.username) u.username = u.username.replace(/./g, "*");
        return u.toString();
    } catch {
        return uri;
    }
}
