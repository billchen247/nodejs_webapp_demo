/**
 * @file tests/setup.js
 * @author Bill Chen
 * @description Boots an in-memory MongoDB for the test suite, and makes
 *   sure the environment variables `src/config/env.js` reads at import
 *   time are safe for tests (a strong-enough JWT_SECRET in particular —
 *   without one, `jsonwebtoken` throws instead of signing a cookie).
 *
 * `mongodb-memory-server` normally downloads a mongod binary on first
 * run. In sandboxed CI environments the download can fail, so we
 * respect the `MONGOMS_SYSTEM_BINARY` env var (point it at a working
 * mongod binary on your machine) or try a conventional cached path at
 * `~/.cache/mongodb-binaries/<version>/mongod`.
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import mongoose from "mongoose";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-only-secret-at-least-32-characters-long";
}
if (!process.env.CLIENT_URLS) {
  process.env.CLIENT_URLS = "http://localhost:5173";
}

if (!process.env.MONGOMS_SYSTEM_BINARY) {
  const candidate = path.join(
    os.homedir(),
    ".cache",
    "mongodb-binaries",
    "7.0.24",
    "mongod",
  );
  if (fs.existsSync(candidate)) {
    process.env.MONGOMS_SYSTEM_BINARY = candidate;
  }
}

const { MongoMemoryServer } = await import("mongodb-memory-server");

let mongod;

export async function startMemoryMongo() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function stopMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export async function clearAllCollections() {
  for (const key of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[key].deleteMany({});
  }
}
