/**
 * @file tests/database.test.js
 * @author Bill Chen
 * @description Unit tests for the connectDatabase helper.
 */
import { describe, it, expect } from "vitest";
import { connectDatabase } from "../src/config/database.js";

describe("connectDatabase", () => {
  it("throws when uri is missing", async () => {
    await expect(connectDatabase()).rejects.toThrow(/MONGODB_URI/);
    await expect(connectDatabase("")).rejects.toThrow(/MONGODB_URI/);
  });
});
