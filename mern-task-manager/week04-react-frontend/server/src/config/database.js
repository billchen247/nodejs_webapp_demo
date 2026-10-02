/**
 * @file src/config/database.js
 * @author Bill Chen
 * @description MongoDB connection helper (same as Week 3).
 */
import mongoose from "mongoose";

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Did you create a .env file?");
  }
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
