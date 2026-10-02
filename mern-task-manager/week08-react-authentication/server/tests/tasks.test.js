/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 8 task API. Every task route
 *   requires authentication, and tasks are scoped to the signed-in user —
 *   these tests cover both the CRUD contract and the ownership boundary.
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

async function registerAndGetAgent(email) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "supersecret",
  });
  return agent;
}

describe("task routes require authentication", () => {
  it("GET /api/tasks returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("POST /api/tasks returns 401 without a cookie", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "x" });
    expect(res.status).toBe(401);
  });
});

describe("task CRUD for an authenticated user", () => {
  it("creates and lists only my tasks", async () => {
    const agent = await registerAndGetAgent("owner@example.com");

    const create = await agent.post("/api/tasks").send({ title: "x" });
    expect(create.status).toBe(201);
    expect(create.body.userId).toBeDefined();

    const list = await agent.get("/api/tasks");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe("x");
  });

  it("rejects missing title with 400", async () => {
    const agent = await registerAndGetAgent("owner2@example.com");
    const res = await agent.post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("fetches a single task I own", async () => {
    const agent = await registerAndGetAgent("owner3@example.com");
    const created = await agent.post("/api/tasks").send({ title: "a" });

    const res = await agent.get(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("a");
  });

  it("returns 400 for bad ids on GET", async () => {
    const agent = await registerAndGetAgent("owner4@example.com");
    const res = await agent.get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown ids on GET", async () => {
    const agent = await registerAndGetAgent("owner5@example.com");
    const res = await agent.get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("updates a task I own", async () => {
    const agent = await registerAndGetAgent("owner6@example.com");
    const created = await agent.post("/api/tasks").send({ title: "a" });

    const res = await agent
      .put(`/api/tasks/${created.body._id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("returns 400 on validation failure", async () => {
    const agent = await registerAndGetAgent("owner7@example.com");
    const created = await agent.post("/api/tasks").send({ title: "a" });

    const res = await agent
      .put(`/api/tasks/${created.body._id}`)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });

  it("deletes a task I own", async () => {
    const agent = await registerAndGetAgent("owner8@example.com");
    const created = await agent.post("/api/tasks").send({ title: "a" });

    const res = await agent.delete(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(200);
    expect(await Task.findById(created.body._id)).toBeNull();
  });
});

describe("ownership boundary between users", () => {
  it("hides another user's task behind a 404 on GET", async () => {
    const alice = await registerAndGetAgent("alice@example.com");
    const bob = await registerAndGetAgent("bob@example.com");

    const aliceTask = await alice.post("/api/tasks").send({ title: "alice-only" });

    const res = await bob.get(`/api/tasks/${aliceTask.body._id}`);
    expect(res.status).toBe(404);
  });

  it("prevents another user from updating my task", async () => {
    const alice = await registerAndGetAgent("alice2@example.com");
    const bob = await registerAndGetAgent("bob2@example.com");

    const aliceTask = await alice.post("/api/tasks").send({ title: "alice-only" });

    const res = await bob
      .put(`/api/tasks/${aliceTask.body._id}`)
      .send({ title: "hijacked" });
    expect(res.status).toBe(404);

    const stillMine = await alice.get(`/api/tasks/${aliceTask.body._id}`);
    expect(stillMine.body.title).toBe("alice-only");
  });

  it("prevents another user from deleting my task", async () => {
    const alice = await registerAndGetAgent("alice3@example.com");
    const bob = await registerAndGetAgent("bob3@example.com");

    const aliceTask = await alice.post("/api/tasks").send({ title: "alice-only" });

    const res = await bob.delete(`/api/tasks/${aliceTask.body._id}`);
    expect(res.status).toBe(404);
    expect(await Task.findById(aliceTask.body._id)).not.toBeNull();
  });

  it("only lists my own tasks, not another user's", async () => {
    const alice = await registerAndGetAgent("alice4@example.com");
    const bob = await registerAndGetAgent("bob4@example.com");

    await alice.post("/api/tasks").send({ title: "alice-task" });
    await bob.post("/api/tasks").send({ title: "bob-task" });

    const aliceList = await alice.get("/api/tasks");
    expect(aliceList.body).toHaveLength(1);
    expect(aliceList.body[0].title).toBe("alice-task");
  });
});

describe("unknown routes", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});
