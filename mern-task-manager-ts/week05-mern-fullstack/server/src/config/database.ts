/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: server/src/config/database.ts
 *
 * All MongoDB connection concerns live here, so no other file has to know
 * what database URL we are using or how to open a connection.
 *
 * Why a dedicated config module?
 *   - Tests want to connect to an in-memory database with a different URI.
 *   - Production will point at MongoDB Atlas.
 *   - Local development points at a local mongod.
 *   Keeping those three in one file means we never have scattered
 *   `mongoose.connect(...)` calls to find and update.
 */
import mongoose from "mongoose";

/**
 * Open a connection to MongoDB.
 *
 * Mongoose buffers queries until the connection is ready, so technically we
 * could call this in parallel with app startup — but awaiting it here gives
 * us a nice early error if the URI is wrong, instead of a mysterious
 * "timeout" when the first request comes in.
 */
export async function connectToDatabase(uri: string): Promise<typeof mongoose> {
  // Fail fast if the URI is empty — much friendlier than Mongoose's own error.
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and set it, or pass a URI explicitly.",
    );
  }

  // Mongoose has sensible defaults; the only knob we flip is `strictQuery`
  // so an unknown field in a filter throws instead of silently matching
  // nothing. Loud failures are better than quiet bugs when students are
  // learning.
  mongoose.set("strictQuery", true);

  return mongoose.connect(uri);
}

/** Close the active connection. Used mainly in tests. */
export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}
