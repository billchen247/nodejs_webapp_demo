/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: server/tests/taskModel.test.ts
 *
 * UNIT-ish tests on the Mongoose model.
 *
 * We call Task.create / find / etc. directly, without going through Express.
 * These tests prove the schema itself behaves — defaults, validation,
 * timestamps, and the JSON transform.
 */
import { describe, expect, it } from "vitest";
import { Task } from "../src/models/Task.js";

describe("Task model", () => {
  it("requires a title", async () => {
    // Mongoose rejects an insert that misses a required field. We assert
    // on the error class so the test is specific — anything else should fail.
    await expect(Task.create({})).rejects.toThrow(/Title is required|validation failed/i);
  });

  it("rejects an empty title", async () => {
    await expect(Task.create({ title: "" })).rejects.toThrow(/Title/i);
  });

  it("fills in defaults for description and completed", async () => {
    const task = await Task.create({ title: "Only a title" });
    expect(task.description).toBe("");
    expect(task.completed).toBe(false);
  });

  it("stamps createdAt and updatedAt", async () => {
    const task = await Task.create({ title: "Timestamp test" });
    expect(task.get("createdAt")).toBeInstanceOf(Date);
    expect(task.get("updatedAt")).toBeInstanceOf(Date);
  });

  it("JSON output exposes `id` instead of `_id` and hides `__v`", () => {
    // `.toJSON()` is what Express.res.json() calls under the hood.
    const task = new Task({ title: "JSON shape" });
    const json = task.toJSON() as Record<string, unknown>;
    expect(typeof json.id).toBe("string");
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  it("trims whitespace from title", async () => {
    const task = await Task.create({ title: "   padded   " });
    expect(task.title).toBe("padded");
  });

  it("rejects titles longer than 200 characters", async () => {
    const long = "x".repeat(201);
    await expect(Task.create({ title: long })).rejects.toThrow(/200 characters/i);
  });
});
