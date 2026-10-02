/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: server/tests/taskModel.test.ts
 *
 * Unit tests on the Mongoose model. Every valid task now also needs a
 * `userId`, so each test either supplies one or asserts the error that
 * comes back when it is missing.
 */
import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Task } from "../src/models/Task.js";

const ownerId = new mongoose.Types.ObjectId().toString();

describe("Task model", () => {
  it("requires a title", async () => {
    await expect(Task.create({ userId: ownerId })).rejects.toThrow(/Title is required|validation failed/i);
  });

  it("requires a userId (new in Week 7)", async () => {
    await expect(Task.create({ title: "No owner" })).rejects.toThrow(/userId|validation failed/i);
  });

  it("rejects an empty title", async () => {
    await expect(Task.create({ title: "", userId: ownerId })).rejects.toThrow(/Title/i);
  });

  it("fills in defaults for description and completed", async () => {
    const task = await Task.create({ title: "Only a title", userId: ownerId });
    expect(task.description).toBe("");
    expect(task.completed).toBe(false);
  });

  it("stamps createdAt and updatedAt", async () => {
    const task = await Task.create({ title: "Timestamp test", userId: ownerId });
    expect(task.get("createdAt")).toBeInstanceOf(Date);
    expect(task.get("updatedAt")).toBeInstanceOf(Date);
  });

  it("JSON output exposes `id`, hides `_id`, `__v`, and `userId`", () => {
    const task = new Task({ title: "JSON shape", userId: ownerId });
    const json = task.toJSON() as Record<string, unknown>;
    expect(typeof json.id).toBe("string");
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    // userId is intentionally omitted from the response body.
    expect(json.userId).toBeUndefined();
  });

  it("trims whitespace from title", async () => {
    const task = await Task.create({ title: "   padded   ", userId: ownerId });
    expect(task.title).toBe("padded");
  });

  it("rejects titles longer than 200 characters", async () => {
    const long = "x".repeat(201);
    await expect(Task.create({ title: long, userId: ownerId })).rejects.toThrow(/200 characters/i);
  });
});
