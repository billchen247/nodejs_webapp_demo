/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 3 Mongo-backed CRUD API.
 *
 * Uses `mongodb-memory-server` so the suite is self-contained: no real
 * MongoDB running on the developer's machine is required.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Task } from "../src/models/Task.js";
import {
  startMemoryMongo,
  stopMemoryMongo,
  clearAllCollections,
} from "./setup.js";

const app = createApp();

beforeAll(async () => {
  await startMemoryMongo();
});

afterAll(async () => {
  await stopMemoryMongo();
});

beforeEach(async () => {
  await clearAllCollections();
});

describe("GET /", () => {
  it("returns a welcome message with the endpoint list", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.endpoints.length).toBeGreaterThan(0);
  });
});

describe("GET /api/tasks", () => {
  it("returns an empty array when there are no tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns tasks sorted newest first", async () => {
    const older = await Task.create({ title: "older" });
    // Shift createdAt backward so we have a predictable ordering.
    older.createdAt = new Date(Date.now() - 10_000);
    await older.save();
    await Task.create({ title: "newer" });

    const res = await request(app).get("/api/tasks");
    expect(res.body.map((t) => t.title)).toEqual(["newer", "older"]);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task when the id is valid and found", async () => {
    const t = await Task.create({ title: "find me" });
    const res = await request(app).get(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("find me");
  });

  it("returns 400 for a malformed id", async () => {
    const res = await request(app).get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid task id" });
  });

  it("returns 404 for a well-formed but unknown id", async () => {
    const res = await request(app).get(
      "/api/tasks/507f1f77bcf86cd799439011",
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "write tests" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "write tests", completed: false });

    const stored = await Task.findById(res.body._id);
    expect(stored).not.toBeNull();
  });

  it("rejects a missing title with 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  it("rejects a title over 200 chars with 400", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("applies partial updates", async () => {
    const t = await Task.create({ title: "a", description: "d" });
    const res = await request(app)
      .put(`/api/tasks/${t._id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: "a", description: "d", completed: true });
  });

  it("returns 400 for a bad id", async () => {
    const res = await request(app).put("/api/tasks/not-an-id").send({ title: "x" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .put("/api/tasks/507f1f77bcf86cd799439011")
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when validation fails on update", async () => {
    const t = await Task.create({ title: "a" });
    const res = await request(app)
      .put(`/api/tasks/${t._id}`)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("removes a task", async () => {
    const t = await Task.create({ title: "gone" });
    const res = await request(app).delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(await Task.findById(t._id)).toBeNull();
  });

  it("returns 400 for a bad id", async () => {
    const res = await request(app).delete("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete(
      "/api/tasks/507f1f77bcf86cd799439011",
    );
    expect(res.status).toBe(404);
  });
});
