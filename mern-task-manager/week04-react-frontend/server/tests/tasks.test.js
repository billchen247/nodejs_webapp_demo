/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 4 task API.
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

beforeAll(async () => await startMemoryMongo());
afterAll(async () => await stopMemoryMongo());
beforeEach(async () => await clearAllCollections());

describe("GET /", () => {
  it("returns a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.endpoints.length).toBeGreaterThan(0);
  });
});

describe("task CRUD", () => {
  it("creates and lists a task", async () => {
    const create = await request(app).post("/api/tasks").send({ title: "x" });
    expect(create.status).toBe(201);
    const list = await request(app).get("/api/tasks");
    expect(list.body).toHaveLength(1);
  });

  it("rejects missing title with 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("fetches a single task", async () => {
    const t = await Task.create({ title: "a" });
    const res = await request(app).get(`/api/tasks/${t._id}`);
    expect(res.body.title).toBe("a");
  });

  it("returns 400 for bad ids on GET", async () => {
    const res = await request(app).get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown ids on GET", async () => {
    const res = await request(app).get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("updates a task", async () => {
    const t = await Task.create({ title: "a" });
    const res = await request(app)
      .put(`/api/tasks/${t._id}`)
      .send({ completed: true });
    expect(res.body.completed).toBe(true);
  });

  it("returns 400 for bad id on PUT", async () => {
    const res = await request(app).put("/api/tasks/nope").send({ title: "x" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown id on PUT", async () => {
    const res = await request(app)
      .put("/api/tasks/507f1f77bcf86cd799439011")
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 400 on validation failure", async () => {
    const t = await Task.create({ title: "a" });
    const res = await request(app)
      .put(`/api/tasks/${t._id}`)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });

  it("deletes a task", async () => {
    const t = await Task.create({ title: "a" });
    const res = await request(app).delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(await Task.findById(t._id)).toBeNull();
  });

  it("returns 400/404 for bad delete ids", async () => {
    expect((await request(app).delete("/api/tasks/nope")).status).toBe(400);
    expect(
      (await request(app).delete("/api/tasks/507f1f77bcf86cd799439011")).status,
    ).toBe(404);
  });
});

describe("unknown routes", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});
