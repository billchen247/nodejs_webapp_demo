/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 7 protected task API.
 *   Crucially: unauthenticated requests must be rejected with 401, and
 *   each authenticated user must only ever see/modify their own tasks.
 *   We use `request.agent(app)` so the login cookie is carried across
 *   requests, one agent per simulated user.
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

async function registerAndLogin(agent, overrides = {}) {
  const payload = {
    name: "Test User",
    email: "user@example.com",
    password: "super-secret-1",
    ...overrides,
  };
  const res = await agent.post("/api/auth/register").send(payload);
  return res.body.user;
}

describe("unauthenticated access", () => {
  it("rejects GET /api/tasks with 401", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("rejects POST /api/tasks with 401", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "x" });
    expect(res.status).toBe(401);
  });

  it("rejects GET /api/tasks/:id with 401", async () => {
    const res = await request(app).get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(401);
  });

  it("rejects PUT and DELETE on /api/tasks/:id with 401", async () => {
    const putRes = await request(app)
      .put("/api/tasks/507f1f77bcf86cd799439011")
      .send({ title: "x" });
    expect(putRes.status).toBe(401);

    const deleteRes = await request(app).delete(
      "/api/tasks/507f1f77bcf86cd799439011",
    );
    expect(deleteRes.status).toBe(401);
  });
});

describe("per-user task ownership", () => {
  it("only lists the authenticated user's own tasks", async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);

    await registerAndLogin(alice, { email: "alice@example.com" });
    await registerAndLogin(bob, { email: "bob@example.com" });

    await alice.post("/api/tasks").send({ title: "alice task 1" });
    await alice.post("/api/tasks").send({ title: "alice task 2" });
    await bob.post("/api/tasks").send({ title: "bob task 1" });

    const aliceList = await alice.get("/api/tasks");
    const bobList = await bob.get("/api/tasks");

    expect(aliceList.body).toHaveLength(2);
    expect(bobList.body).toHaveLength(1);
    expect(aliceList.body.every((t) => t.title.startsWith("alice"))).toBe(true);
    expect(bobList.body[0].title).toBe("bob task 1");
  });

  it("sets the owner from the authenticated user, ignoring any userId in the body", async () => {
    const alice = request.agent(app);
    const bob = await registerAndLogin(request.agent(app), {
      email: "bob2@example.com",
    });
    const aliceUser = await registerAndLogin(alice, { email: "alice2@example.com" });

    const res = await alice
      .post("/api/tasks")
      .send({ title: "sneaky", userId: bob.id });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(aliceUser.id);
  });

  it("rejects creating a task without a title with 400", async () => {
    const alice = request.agent(app);
    await registerAndLogin(alice, { email: "alice3@example.com" });
    const res = await alice.post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 (not 403) when fetching another user's task", async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await registerAndLogin(alice, { email: "alice4@example.com" });
    await registerAndLogin(bob, { email: "bob4@example.com" });

    const created = await alice.post("/api/tasks").send({ title: "secret" });
    const bobGet = await bob.get(`/api/tasks/${created.body._id}`);
    expect(bobGet.status).toBe(404);
  });

  it("returns 400 for a malformed task id", async () => {
    const alice = request.agent(app);
    await registerAndLogin(alice, { email: "alice5@example.com" });
    const res = await alice.get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("does not allow updating another user's task", async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await registerAndLogin(alice, { email: "alice6@example.com" });
    await registerAndLogin(bob, { email: "bob6@example.com" });

    const created = await alice.post("/api/tasks").send({ title: "alice-only" });
    const res = await bob
      .put(`/api/tasks/${created.body._id}`)
      .send({ title: "hacked" });
    expect(res.status).toBe(404);

    const stillAlices = await Task.findById(created.body._id);
    expect(stillAlices.title).toBe("alice-only");
  });

  it("does not allow deleting another user's task", async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await registerAndLogin(alice, { email: "alice7@example.com" });
    await registerAndLogin(bob, { email: "bob7@example.com" });

    const created = await alice.post("/api/tasks").send({ title: "keep-me" });
    const res = await bob.delete(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(404);
    expect(await Task.findById(created.body._id)).not.toBeNull();
  });

  it("lets the owner update and delete their own task", async () => {
    const alice = request.agent(app);
    await registerAndLogin(alice, { email: "alice8@example.com" });

    const created = await alice.post("/api/tasks").send({ title: "mine" });
    const updated = await alice
      .put(`/api/tasks/${created.body._id}`)
      .send({ completed: true });
    expect(updated.status).toBe(200);
    expect(updated.body.completed).toBe(true);

    const deleted = await alice.delete(`/api/tasks/${created.body._id}`);
    expect(deleted.status).toBe(200);
    expect(await Task.findById(created.body._id)).toBeNull();
  });
});
