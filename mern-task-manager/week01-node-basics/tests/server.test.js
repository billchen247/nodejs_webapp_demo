/**
 * @file tests/server.test.js
 * @author Bill Chen
 * @description Unit + integration tests for the Week 1 HTTP server.
 *
 * We use Vitest as the test runner (fast, ESM-native) and `supertest` to
 * drive HTTP requests against our server without binding a real network
 * port. `supertest` works directly against a Node `http.Server` instance.
 *
 * Teaching note: tests follow the AAA pattern — Arrange, Act, Assert.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { server, requestHandler, sendJson } from "../src/server.js";
import { tasks } from "../src/data/tasks.js";

describe("GET /", () => {
  it("returns a welcome message and the list of endpoints", async () => {
    const res = await request(server).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(Array.isArray(res.body.endpoints)).toBe(true);
    expect(res.body.endpoints).toContain("GET /api/tasks");
  });
});

describe("GET /api/tasks", () => {
  it("returns every task in the in-memory array", async () => {
    const res = await request(server).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(tasks.length);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("title");
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task when the id matches", async () => {
    const res = await request(server).get("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, title: expect.any(String) });
  });

  it("returns 404 when the id does not exist", async () => {
    const res = await request(server).get("/api/tasks/9999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Task not found" });
  });
});

describe("Unknown routes", () => {
  it("returns 404 with the method/url echoed back", async () => {
    const res = await request(server).get("/does/not/exist");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error: "Not Found",
      method: "GET",
      url: "/does/not/exist",
    });
  });

  it("returns 404 for a POST (we only support GET in Week 1)", async () => {
    const res = await request(server).post("/api/tasks");
    expect(res.status).toBe(404);
  });
});

describe("sendJson helper", () => {
  it("sets status, content-type, and stringifies the body", () => {
    // We fake just the res surface we care about: writeHead + end.
    const calls = { writeHead: null, end: null };
    const fakeRes = {
      writeHead: (status, headers) => (calls.writeHead = { status, headers }),
      end: (body) => (calls.end = body),
    };
    sendJson(fakeRes, 418, { teapot: true });
    expect(calls.writeHead).toEqual({
      status: 418,
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(calls.end)).toEqual({ teapot: true });
  });
});

describe("requestHandler (unit, no network)", () => {
  it("responds to GET / without going through http.Server", () => {
    const chunks = { status: null, body: null };
    const fakeRes = {
      writeHead: (s) => (chunks.status = s),
      end: (b) => (chunks.body = JSON.parse(b)),
    };
    requestHandler({ method: "GET", url: "/" }, fakeRes);
    expect(chunks.status).toBe(200);
    expect(chunks.body).toHaveProperty("message");
  });
});
