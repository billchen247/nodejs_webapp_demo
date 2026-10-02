/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 01
 * File: tests/tasks.test.ts
 *
 * The point of this test file is to introduce the *idea* of automated tests.
 *
 * There are two groups below:
 *   1. Pure "unit" tests on the data layer (getAllTasks / getTaskById).
 *   2. HTTP-level tests that start the real server on a random port and
 *      hit it with fetch. We call these "integration" tests because they
 *      cross module boundaries — they prove that the handler, the data
 *      layer, and the Node http module actually work together.
 *
 * We do not need Supertest or Express yet; fetch works fine against a
 * local Node server.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createServer } from "../src/server.js";
import { _resetTasksForTests, getAllTasks, getTaskById } from "../src/data/tasks.js";

describe("Task data layer", () => {
  // Each test should start from the same known seed data. If one test mutates
  // the array, the next test must not inherit that mutation.
  beforeEach(() => {
    _resetTasksForTests();
  });

  it("returns all seeded tasks", () => {
    const tasks = getAllTasks();
    expect(tasks).toHaveLength(3);
    expect(tasks[0].title).toBe("Learn Node.js");
  });

  it("looks up a task by id", () => {
    const task = getTaskById(2);
    expect(task?.title).toBe("Learn TypeScript");
  });

  it("returns undefined for an unknown id", () => {
    expect(getTaskById(9999)).toBeUndefined();
  });

  it("returns a copy of the array (callers cannot mutate the store)", () => {
    const snapshot = getAllTasks();
    snapshot.pop();
    // The store itself should still have all three tasks.
    expect(getAllTasks()).toHaveLength(3);
  });
});

describe("HTTP server", () => {
  // We start the server on port 0 so Node picks a free port automatically.
  // That avoids "port already in use" errors when the suite is re-run quickly.
  const server = createServer();
  let baseUrl = "";

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it("GET / returns a welcome payload", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/Welcome/i);
  });

  it("GET /api/tasks returns the list of tasks as JSON", async () => {
    const res = await fetch(`${baseUrl}/api/tasks`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);
  });

  it("GET /api/tasks/:id returns a single task", async () => {
    const res = await fetch(`${baseUrl}/api/tasks/1`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
    expect(body.title).toBe("Learn Node.js");
  });

  it("GET /api/tasks/:id returns 404 for a missing task", async () => {
    const res = await fetch(`${baseUrl}/api/tasks/9999`);
    expect(res.status).toBe(404);
  });

  it("GET /api/tasks/:id returns 400 for a non-numeric id", async () => {
    const res = await fetch(`${baseUrl}/api/tasks/abc`);
    expect(res.status).toBe(400);
  });

  it("Unknown routes return 404", async () => {
    const res = await fetch(`${baseUrl}/does-not-exist`);
    expect(res.status).toBe(404);
  });

  it("Non-GET methods return 405", async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, { method: "POST" });
    expect(res.status).toBe(405);
  });
});
