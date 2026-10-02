/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 2 Express CRUD API.
 *
 * `supertest` lets us drive the Express app directly (no network).
 * Each test starts with the seed data reset so order between tests
 * does not matter.
 */
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetTasks } from "../src/data/tasks.js";

let app;

beforeEach(() => {
  resetTasks();
  app = createApp();
});

describe("GET /", () => {
  it("returns a welcome message with the endpoint list", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body.endpoints.length).toBeGreaterThan(0);
  });
});

describe("GET /api/tasks", () => {
  it("returns the full list of tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task when it exists", async () => {
    const res = await request(app).get("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when it does not", async () => {
    const res = await request(app).get("/api/tasks/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Task not found" });
  });
});

describe("POST /api/tasks", () => {
  it("creates a task and returns 201 with the new id", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Write tests", description: "with vitest" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Write tests",
      description: "with vitest",
      completed: false,
    });
    expect(typeof res.body.id).toBe("number");

    // Confirm the server-side list grew by one.
    const list = await request(app).get("/api/tasks");
    expect(list.body).toHaveLength(3);
  });

  it("rejects a request with no title (400)", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title is required" });
  });

  it("rejects a non-string title (400)", async () => {
    const res = await request(app).post("/api/tasks").send({ title: 42 });
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("applies a partial update and returns the updated task", async () => {
    const res = await request(app)
      .put("/api/tasks/2")
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 2, completed: true });
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).put("/api/tasks/9999").send({ title: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("removes the task and returns the removed body", async () => {
    const res = await request(app).delete("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);

    const after = await request(app).get("/api/tasks");
    expect(after.body).toHaveLength(1);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).delete("/api/tasks/9999");
    expect(res.status).toBe(404);
  });
});

describe("Unknown routes", () => {
  it("falls through to the 404 handler", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });
});
