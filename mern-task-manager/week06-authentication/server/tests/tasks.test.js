/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 6 task API. Tasks are not
 *   yet tied to a specific user (that lands in Week 7) — the CRUD surface
 *   is unchanged from Week 4/5, so these tests mirror those too.
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
const credentials = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
};
let authenticatedAgent;

beforeAll(async () => await startMemoryMongo());
afterAll(async () => await stopMemoryMongo());
beforeEach(async () => {
  await clearAllCollections();
  authenticatedAgent = request.agent(app);
  await authenticatedAgent.post("/api/auth/register").send(credentials);
});

describe("GET /", () => {
  it("returns a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/week 6/i);
  });
});

describe("task CRUD", () => {
  it("creates and lists a task", async () => {
    const create = await authenticatedAgent
      .post("/api/tasks")
      .send({ title: "x" });
    expect(create.status).toBe(201);
    const list = await authenticatedAgent.get("/api/tasks");
    expect(list.body).toHaveLength(1);
  });

  it("rejects missing title with 400", async () => {
    const res = await authenticatedAgent.post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("fetches a single task", async () => {
    const t = await Task.create({ title: "a" });
    const res = await authenticatedAgent.get(`/api/tasks/${t._id}`);
    expect(res.body.title).toBe("a");
  });

  it("returns 400 for bad ids on GET", async () => {
    const res = await authenticatedAgent.get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown ids on GET", async () => {
    const res = await authenticatedAgent.get(
      "/api/tasks/507f1f77bcf86cd799439011",
    );
    expect(res.status).toBe(404);
  });

  it("updates a task", async () => {
    const t = await Task.create({ title: "a" });
    const res = await authenticatedAgent
      .put(`/api/tasks/${t._id}`)
      .send({ completed: true });
    expect(res.body.completed).toBe(true);
  });

  it("returns 400 for bad id on PUT", async () => {
    const res = await authenticatedAgent
      .put("/api/tasks/nope")
      .send({ title: "x" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown id on PUT", async () => {
    const res = await authenticatedAgent
      .put("/api/tasks/507f1f77bcf86cd799439011")
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 400 on validation failure", async () => {
    const t = await Task.create({ title: "a" });
    const res = await authenticatedAgent
      .put(`/api/tasks/${t._id}`)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });

  it("deletes a task", async () => {
    const t = await Task.create({ title: "a" });
    const res = await authenticatedAgent.delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(await Task.findById(t._id)).toBeNull();
  });

  it("returns 400/404 for bad delete ids", async () => {
    expect((await authenticatedAgent.delete("/api/tasks/nope")).status).toBe(
      400,
    );
    expect(
      (
        await authenticatedAgent.delete(
          "/api/tasks/507f1f77bcf86cd799439011",
        )
      ).status,
    ).toBe(404);
  });

  it("requires authentication for every task method", async () => {
    const responses = await Promise.all([
      request(app).get("/api/tasks"),
      request(app).get("/api/tasks/507f1f77bcf86cd799439011"),
      request(app).post("/api/tasks").send({ title: "x" }),
      request(app).put("/api/tasks/507f1f77bcf86cd799439011").send({}),
      request(app).delete("/api/tasks/507f1f77bcf86cd799439011"),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401, 401, 401,
    ]);
  });
});

describe("unknown routes", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});
