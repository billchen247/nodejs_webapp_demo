/**
 * @file src/config/database.js
 * @author Bill Chen
 * @description MongoDB connection helper.
 *
 * We keep this in its own file so `server.js` stays focused on routing +
 * startup. Hiding the connection detail behind a function also makes it
 * trivial to point tests at a different URI (e.g. mongodb-memory-server).
 */
import mongoose from "mongoose";

/**
 * Connect Mongoose to the given MongoDB URI.
 * @param {string} uri - full MongoDB connection string
 * @throws if `uri` is missing (prevents accidental connections to localhost
 *         with the wrong credentials).
 */
export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Did you create a .env file?");
  }
  // Mongoose 7+ defaults are sensible — the legacy options (useNewUrlParser,
  // useUnifiedTopology, ...) are no longer needed.
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
}

/** Convenience helper to tear down the connection (used by tests). */
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
