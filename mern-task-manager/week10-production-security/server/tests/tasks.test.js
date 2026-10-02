/**
 * @file tests/tasks.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 10 task API: standard CRUD,
 *   plus ownership — a task created by one user must be invisible (404,
 *   not 403 — see requireRole.js for why that distinction matters) to
 *   every other user.
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

async function registerAgent(email) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "correct-horse-123",
  });
  return { agent, user: res.body.user };
}

describe("task CRUD (owner)", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("creates and lists a task", async () => {
    const { agent } = await registerAgent("owner@example.com");
    const create = await agent.post("/api/tasks").send({ title: "write tests" });
    expect(create.status).toBe(201);
    expect(create.body.title).toBe("write tests");

    const list = await agent.get("/api/tasks");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("rejects missing title with 400", async () => {
    const { agent } = await registerAgent("owner@example.com");
    const res = await agent.post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a non-boolean completed with 400", async () => {
    const { agent } = await registerAgent("owner@example.com");
    const res = await agent
      .post("/api/tasks")
      .send({ title: "x", completed: "yes" });
    expect(res.status).toBe(400);
  });

  it("fetches a single task", async () => {
    const { agent, user } = await registerAgent("owner@example.com");
    const t = await Task.create({ title: "a", userId: user.id });
    const res = await agent.get(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("a");
  });

  it("returns 400 for a malformed id", async () => {
    const { agent } = await registerAgent("owner@example.com");
    const res = await agent.get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed but unknown id", async () => {
    const { agent } = await registerAgent("owner@example.com");
    const res = await agent.get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("updates a task", async () => {
    const { agent, user } = await registerAgent("owner@example.com");
    const t = await Task.create({ title: "a", userId: user.id });
    const res = await agent.put(`/api/tasks/${t._id}`).send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("returns 400 on validation failure for update", async () => {
    const { agent, user } = await registerAgent("owner@example.com");
    const t = await Task.create({ title: "a", userId: user.id });
    const res = await agent
      .put(`/api/tasks/${t._id}`)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });

  it("deletes a task", async () => {
    const { agent, user } = await registerAgent("owner@example.com");
    const t = await Task.create({ title: "a", userId: user.id });
    const res = await agent.delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(200);
    expect(await Task.findById(t._id)).toBeNull();
  });
});

describe("task ownership", () => {
  it("hides another user's task behind a 404 on GET", async () => {
    const { user: owner } = await registerAgent("owner@example.com");
    const { agent: intruder } = await registerAgent("intruder@example.com");
    const t = await Task.create({ title: "secret", userId: owner.id });

    const res = await intruder.get(`/api/tasks/${t._id}`);
    expect(res.status).toBe(404);
  });

  it("does not let another user update someone else's task", async () => {
    const { user: owner } = await registerAgent("owner@example.com");
    const { agent: intruder } = await registerAgent("intruder@example.com");
    const t = await Task.create({ title: "secret", userId: owner.id });

    const res = await intruder.put(`/api/tasks/${t._id}`).send({ completed: true });
    expect(res.status).toBe(404);
    expect((await Task.findById(t._id)).completed).toBe(false);
  });

  it("does not let another user delete someone else's task", async () => {
    const { user: owner } = await registerAgent("owner@example.com");
    const { agent: intruder } = await registerAgent("intruder@example.com");
    const t = await Task.create({ title: "secret", userId: owner.id });

    const res = await intruder.delete(`/api/tasks/${t._id}`);
    expect(res.status).toBe(404);
    expect(await Task.findById(t._id)).not.toBeNull();
  });

  it("only lists the authenticated user's own tasks", async () => {
    const { agent: a, user: userA } = await registerAgent("a@example.com");
    const { agent: b, user: userB } = await registerAgent("b@example.com");
    await Task.create({ title: "a1", userId: userA.id });
    await Task.create({ title: "a2", userId: userA.id });
    await Task.create({ title: "b1", userId: userB.id });

    const resA = await a.get("/api/tasks");
    expect(resA.body).toHaveLength(2);

    const resB = await b.get("/api/tasks");
    expect(resB.body).toHaveLength(1);
  });
});
