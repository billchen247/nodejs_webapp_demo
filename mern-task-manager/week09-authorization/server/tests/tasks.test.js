/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the per-user task API. Confirms the
 *   Week 7/8 ownership rules still hold now that `authenticate` also
 *   carries a `role`: regular users can fully manage their own tasks,
 *   nobody can see or touch someone else's, and every endpoint is 401
 *   for anonymous callers.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  startMemoryMongo,
  stopMemoryMongo,
  clearAllCollections,
} from "./setup.js";

const app = createApp();

beforeAll(async () => await startMemoryMongo());
afterAll(async () => await stopMemoryMongo());
beforeEach(async () => await clearAllCollections());

async function registerAgent(email) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({
    name: "Owner",
    email,
    password: "supersecret",
  });
  return agent;
}

describe("unauthenticated requests", () => {
  it("returns 401 for every task endpoint without a cookie", async () => {
    expect((await request(app).get("/api/tasks")).status).toBe(401);
    expect((await request(app).get("/api/tasks/507f1f77bcf86cd799439011")).status).toBe(401);
    expect((await request(app).post("/api/tasks").send({ title: "x" })).status).toBe(401);
    expect(
      (await request(app).put("/api/tasks/507f1f77bcf86cd799439011").send({ title: "x" })).status,
    ).toBe(401);
    expect((await request(app).delete("/api/tasks/507f1f77bcf86cd799439011")).status).toBe(401);
  });
});

describe("task CRUD for a regular user", () => {
  it("creates and lists only my own tasks", async () => {
    const alice = await registerAgent("alice@example.com");
    const create = await alice.post("/api/tasks").send({ title: "Write tests" });
    expect(create.status).toBe(201);
    expect(create.body.title).toBe("Write tests");

    const list = await alice.get("/api/tasks");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("rejects missing title with 400", async () => {
    const alice = await registerAgent("alice@example.com");
    const res = await alice.post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("fetches a single task I own", async () => {
    const alice = await registerAgent("alice@example.com");
    const created = await alice.post("/api/tasks").send({ title: "a" });
    const res = await alice.get(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("a");
  });

  it("returns 400 for a malformed id", async () => {
    const alice = await registerAgent("alice@example.com");
    const res = await alice.get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id", async () => {
    const alice = await registerAgent("alice@example.com");
    const res = await alice.get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("updates a task I own", async () => {
    const alice = await registerAgent("alice@example.com");
    const created = await alice.post("/api/tasks").send({ title: "a" });
    const res = await alice
      .put(`/api/tasks/${created.body._id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("deletes a task I own", async () => {
    const alice = await registerAgent("alice@example.com");
    const created = await alice.post("/api/tasks").send({ title: "a" });
    const res = await alice.delete(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(200);

    const after = await alice.get(`/api/tasks/${created.body._id}`);
    expect(after.status).toBe(404);
  });
});

describe("task isolation between users", () => {
  it("hides another user's task behind a 404 on GET", async () => {
    const alice = await registerAgent("alice@example.com");
    const bob = await registerAgent("bob@example.com");
    const created = await alice.post("/api/tasks").send({ title: "Alice's secret" });

    const res = await bob.get(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(404);
  });

  it("does not include another user's tasks in the list", async () => {
    const alice = await registerAgent("alice@example.com");
    const bob = await registerAgent("bob@example.com");
    await alice.post("/api/tasks").send({ title: "Alice's task" });

    const res = await bob.get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("returns 404, not 403, when updating someone else's task", async () => {
    const alice = await registerAgent("alice@example.com");
    const bob = await registerAgent("bob@example.com");
    const created = await alice.post("/api/tasks").send({ title: "Alice's task" });

    const res = await bob.put(`/api/tasks/${created.body._id}`).send({ title: "hijacked" });
    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting someone else's task", async () => {
    const alice = await registerAgent("alice@example.com");
    const bob = await registerAgent("bob@example.com");
    const created = await alice.post("/api/tasks").send({ title: "Alice's task" });

    const res = await bob.delete(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(404);

    // Alice's task is untouched.
    const stillThere = await alice.get(`/api/tasks/${created.body._id}`);
    expect(stillThere.status).toBe(200);
  });

  it("ignores a userId sent in the request body on create", async () => {
    const alice = await registerAgent("alice@example.com");
    const res = await alice
      .post("/api/tasks")
      .send({ title: "x", userId: "507f1f77bcf86cd799439011" });
    expect(res.status).toBe(201);
    expect(res.body.userId).not.toBe("507f1f77bcf86cd799439011");
  });
});
