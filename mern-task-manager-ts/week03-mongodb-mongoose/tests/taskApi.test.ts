/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 03
 * File: tests/taskApi.test.ts
 *
 * INTEGRATION tests that drive the full Express + Mongoose stack.
 *
 * Compared to Week 2, the big change is that there is no `_resetTasksForTests`
 * import — the Vitest setup file wipes the `tasks` collection between tests.
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Task } from "../src/models/Task.js";

const app = createApp();

async function seed() {
  // Create three tasks in a deterministic order and return them newest-first,
  // which is also the order the API returns them in.
  const first = await Task.create({ title: "Learn MongoDB" });
  // Pause 2ms to force distinct createdAt timestamps so sort order is stable.
  await new Promise((r) => setTimeout(r, 2));
  const second = await Task.create({ title: "Learn Mongoose" });
  await new Promise((r) => setTimeout(r, 2));
  const third = await Task.create({ title: "Replace in-memory array" });
  return [third, second, first]; // newest-first
}

describe("GET /api/tasks", () => {
  it("returns [] when the collection is empty", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all tasks, newest first", async () => {
    const [newest, middle, oldest] = await seed();
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.map((t: { id: string }) => t.id)).toEqual([
      newest.id,
      middle.id,
      oldest.id,
    ]);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task", async () => {
    const task = await Task.create({ title: "Fetch me" });
    const res = await request(app).get(`/api/tasks/${task.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(task.id);
    expect(res.body.title).toBe("Fetch me");
  });

  it("returns 404 for a valid-looking id that does not exist", async () => {
    const res = await request(app).get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid ObjectId", async () => {
    const res = await request(app).get("/api/tasks/not-an-objectid");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task and returns 201", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "New task" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.title).toBe("New task");
    expect(res.body.completed).toBe(false);

    const stored = await Task.findById(res.body.id);
    expect(stored).not.toBeNull();
  });

  it("rejects a missing title with 400 and validation details", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.title).toBeTruthy();
  });

  it("drops a client-supplied _id (the server owns it)", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ _id: "507f1f77bcf86cd799439011", title: "Try to pick my id" });
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe("507f1f77bcf86cd799439011");
  });
});

describe("PUT /api/tasks/:id", () => {
  it("updates a task and returns the new document", async () => {
    const task = await Task.create({ title: "To update" });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ completed: true, title: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.title).toBe("Updated");
  });

  it("re-runs validators on update", async () => {
    const task = await Task.create({ title: "Must stay valid" });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a missing document", async () => {
    const res = await request(app)
      .put("/api/tasks/507f1f77bcf86cd799439011")
      .send({ completed: true });
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const res = await request(app).put("/api/tasks/not-valid").send({ completed: true });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes an existing task and returns 204", async () => {
    const task = await Task.create({ title: "Remove me" });
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(204);
    expect(await Task.findById(task.id)).toBeNull();
  });

  it("returns 404 when the task is not there", async () => {
    const res = await request(app).delete("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const res = await request(app).delete("/api/tasks/not-valid");
    expect(res.status).toBe(400);
  });
});
