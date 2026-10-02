/**
 * @file tests/setup.js
 * @author Bill Chen
 * @description Shared test setup: spin up an in-memory MongoDB with
 *   `mongodb-memory-server`, connect Mongoose to it, and tear it all down
 *   when the suite finishes.
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

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
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
