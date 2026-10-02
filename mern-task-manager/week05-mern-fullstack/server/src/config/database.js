/**
 * @file src/config/database.js
 * @author Bill Chen
 * @description Database connection helper.
 *   We keep this in its own file so the server stays focused on routing.
 */
import mongoose from "mongoose";

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Did you create a .env file?");
  }
  // Mongoose 7+ defaults are sensible; we don't need the old options.
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
}
