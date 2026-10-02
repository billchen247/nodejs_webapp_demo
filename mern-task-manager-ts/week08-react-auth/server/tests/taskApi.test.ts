/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: server/tests/taskApi.test.ts
 *
 * Integration tests. Each test either authenticates as a user first (via
 * Supertest's `agent()`, which carries cookies) or deliberately omits the
 * cookie to verify the 401 path.
 */
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Task } from "../src/models/Task.js";

const ALLOWED_ORIGIN = "http://localhost:5173";
const app = createApp({ clientUrl: ALLOWED_ORIGIN });

/** Register a user and return an agent whose cookie jar is that user's. */
async function registerAgent(email: string) {
  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/register")
    .send({ email, password: "correct horse battery", name: email });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, userId: res.body.user.id as string };
}

describe("Task API requires authentication", () => {
  it("GET /api/tasks returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("POST /api/tasks returns 401 without a cookie", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "x" });
    expect(res.status).toBe(401);
  });

  it("PUT /api/tasks/:id returns 401 without a cookie", async () => {
    const res = await request(app).put("/api/tasks/anything").send({ title: "x" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/tasks/:id returns 401 without a cookie", async () => {
    const res = await request(app).delete("/api/tasks/anything");
    expect(res.status).toBe(401);
  });
});

describe("CRUD as the owner", () => {
  it("creates a task and lists it", async () => {
    const { agent } = await registerAgent("ada@example.com");
    const create = await agent.post("/api/tasks").send({ title: "Mine 1" });
    expect(create.status).toBe(201);
    expect(create.body.title).toBe("Mine 1");

    const list = await agent.get("/api/tasks");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe("Mine 1");
  });

  it("rejects a missing title with 400", async () => {
    const { agent } = await registerAgent("bob@example.com");
    const res = await agent.post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("updates a task", async () => {
    const { agent } = await registerAgent("carol@example.com");
    const created = await agent.post("/api/tasks").send({ title: "To update" });
    const res = await agent
      .put(`/api/tasks/${created.body.id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("deletes a task", async () => {
    const { agent } = await registerAgent("dan@example.com");
    const created = await agent.post("/api/tasks").send({ title: "To delete" });
    const res = await agent.delete(`/api/tasks/${created.body.id}`);
    expect(res.status).toBe(204);
    const list = await agent.get("/api/tasks");
    expect(list.body).toHaveLength(0);
  });

  it("the response body never includes userId", async () => {
    const { agent } = await registerAgent("eve@example.com");
    const created = await agent.post("/api/tasks").send({ title: "Secret owner" });
    expect(created.body.userId).toBeUndefined();
    const list = await agent.get("/api/tasks");
    expect(list.body[0].userId).toBeUndefined();
  });

  it("ignores any userId sent in the body — the server pins it to the caller", async () => {
    const { agent } = await registerAgent("fran@example.com");
    const otherId = "507f1f77bcf86cd799439011";
    const created = await agent
      .post("/api/tasks")
      .send({ title: "Try to spoof", userId: otherId });
    expect(created.status).toBe(201);

    // Verify in the DB that the task's userId is NOT the spoofed one.
    const stored = await Task.findById(created.body.id);
    expect(stored).not.toBeNull();
    expect(stored!.userId.toString()).not.toBe(otherId);
  });
});

describe("Ownership isolation", () => {
  it("one user's list does not include another user's tasks", async () => {
    const alice = await registerAgent("alice@example.com");
    const bob = await registerAgent("bob2@example.com");

    await alice.agent.post("/api/tasks").send({ title: "Alice's" });
    await bob.agent.post("/api/tasks").send({ title: "Bob's" });

    const aList = await alice.agent.get("/api/tasks");
    const bList = await bob.agent.get("/api/tasks");

    expect(aList.body.map((t: { title: string }) => t.title)).toEqual(["Alice's"]);
    expect(bList.body.map((t: { title: string }) => t.title)).toEqual(["Bob's"]);
  });

  it("reading someone else's task returns 404, not 403", async () => {
    const alice = await registerAgent("alice2@example.com");
    const bob = await registerAgent("bob3@example.com");

    const aliceTask = await alice.agent.post("/api/tasks").send({ title: "Alice's" });
    const res = await bob.agent.get(`/api/tasks/${aliceTask.body.id}`);
    expect(res.status).toBe(404);
  });

  it("updating someone else's task returns 404", async () => {
    const alice = await registerAgent("alice3@example.com");
    const bob = await registerAgent("bob4@example.com");

    const aliceTask = await alice.agent.post("/api/tasks").send({ title: "Alice's" });
    const res = await bob.agent
      .put(`/api/tasks/${aliceTask.body.id}`)
      .send({ completed: true });
    expect(res.status).toBe(404);

    // Alice's task was not mutated.
    const check = await alice.agent.get(`/api/tasks/${aliceTask.body.id}`);
    expect(check.body.completed).toBe(false);
  });

  it("deleting someone else's task returns 404", async () => {
    const alice = await registerAgent("alice4@example.com");
    const bob = await registerAgent("bob5@example.com");

    const aliceTask = await alice.agent.post("/api/tasks").send({ title: "Alice's" });
    const res = await bob.agent.delete(`/api/tasks/${aliceTask.body.id}`);
    expect(res.status).toBe(404);
    // Alice's task still exists.
    const check = await alice.agent.get(`/api/tasks/${aliceTask.body.id}`);
    expect(check.status).toBe(200);
  });
});

describe("Validation and bad ids", () => {
  it("returns 400 for an invalid ObjectId", async () => {
    const { agent } = await registerAgent("gina@example.com");
    const res = await agent.get("/api/tasks/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for a valid-looking but non-existent id", async () => {
    const { agent } = await registerAgent("harry@example.com");
    const res = await agent.get("/api/tasks/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });
});
