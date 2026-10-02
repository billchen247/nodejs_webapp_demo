/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 05
 * File: server/tests/setup.ts
 *
 * Vitest "setup file" — runs ONCE before all tests in the suite.
 *
 * We start an in-memory MongoDB (mongodb-memory-server), connect Mongoose
 * to it, and tear it down after the whole run. Each test also wipes the
 * `tasks` collection so test ordering never matters.
 *
 * This is the pattern that keeps our database tests:
 *   - fast (no real network),
 *   - safe (never touches the student's real dev database),
 *   - deterministic (every test starts from an empty collection).
 */
import { afterAll, afterEach, beforeAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
  // mongodb-memory-server will download a MongoDB binary on first run and
  // cache it in ~/.cache/mongodb-binaries. If you already have one on disk,
  // set `MONGOMS_SYSTEM_BINARY=/path/to/mongod` in your environment to skip
  // the download entirely.
  mongod = await MongoMemoryServer.create({
    // Use wiredTiger (not the old `ephemeralForTest` default). The latter
    // was removed in MongoDB 7, so pinning the storage engine makes the
    // tests robust across binary versions.
    instance: { storageEngine: "wiredTiger" },
  });
  const uri = mongod.getUri();
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Drop every collection between tests. We prefer `deleteMany({})` over
  // `dropDatabase()` because it keeps indexes intact and runs faster.
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
