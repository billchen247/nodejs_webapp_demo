/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: tests/taskApi.test.ts
 *
 * API-level tests driven by Supertest.
 *
 * Supertest takes an Express app and lets us issue HTTP requests against it
 * *without* actually binding to a port. That makes tests fast and parallel-safe.
 *
 * We re-seed the data layer before each test so one test cannot pollute the
 * next. In Week 3 we will do the same thing with the MongoDB test database.
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { _resetTasksForTests } from "../src/data/tasks.js";

const app = createApp();

beforeEach(() => {
  _resetTasksForTests();
});

describe("GET /api/tasks", () => {
  it("returns the full list with 200", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task when it exists", async () => {
    const res = await request(app).get("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when the task does not exist", async () => {
    const res = await request(app).get("/api/tasks/9999");
    expect(res.status).toBe(404);
  });

  it("returns 400 when the id is not a number", async () => {
    const res = await request(app).get("/api/tasks/not-a-number");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task and returns 201 with the new record", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Walk the dog", description: "Twice a day" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
    expect(res.body.title).toBe("Walk the dog");
    expect(res.body.completed).toBe(false);

    // The new task should actually appear in subsequent list calls.
    const list = await request(app).get("/api/tasks");
    expect(list.body).toHaveLength(4);
  });

  it("rejects a missing title with 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("rejects an empty title with 400", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
  });

  it("ignores a client-supplied id (the server owns ids)", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ id: 9999, title: "Try to cheat the id" });
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(9999);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("updates fields and returns 200 with the new record", async () => {
    const res = await request(app)
      .put("/api/tasks/1")
      .send({ completed: true, title: "Learn Express (done)" });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.title).toBe("Learn Express (done)");
  });

  it("returns 404 for an unknown task", async () => {
    const res = await request(app).put("/api/tasks/9999").send({ completed: true });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const res = await request(app).put("/api/tasks/abc").send({ completed: true });
    expect(res.status).toBe(400);
  });

  it("ignores unknown fields silently", async () => {
    const res = await request(app)
      .put("/api/tasks/1")
      .send({ hackField: "nope", completed: true });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("hackField");
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes a task and returns 204 with no body", async () => {
    const res = await request(app).delete("/api/tasks/1");
    expect(res.status).toBe(204);
    expect(res.text).toBe("");

    const after = await request(app).get("/api/tasks/1");
    expect(after.status).toBe(404);
  });

  it("returns 404 when the task is not there", async () => {
    const res = await request(app).delete("/api/tasks/9999");
    expect(res.status).toBe(404);
  });
});

describe("Unknown routes", () => {
  it("returns 404 as JSON", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });
});
