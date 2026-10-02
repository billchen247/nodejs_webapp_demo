/**
 * @file tests/auth.test.js
 * @author Bill Chen
 * @description Integration tests for register/login/logout/me and the
 *   forgot-password / reset-password flow.
 *
 * The forgot-password endpoint never returns the raw reset token (that
 * would defeat the point of hashing it at rest) — in development it logs
 * the reset link to the console instead of emailing it. We spy on
 * `console.log` to capture that link and pull the token out of it, the
 * same way a human reading the dev console would.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
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

const credentials = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse-123",
};

describe("GET /", () => {
  it("returns a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/week 10/i);
  });
});

describe("GET /healthz", () => {
  it("reports ok without touching the database", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("POST /api/auth/register", () => {
  it("creates a user, sets an auth cookie, and never leaks the password hash", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.role).toBe("user");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, password: "short" });
    expect(res.status).toBe(400);
  });

  it("ignores any role sent in the request body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(credentials);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "totally-wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when there is no auth cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user when authenticated", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(credentials);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the cookie so /me is no longer authenticated", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(credentials);
    await agent.post("/api/auth/logout");
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("forgot-password / reset-password", () => {
  it("always returns 200 for forgot-password, even for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("rejects an invalid or expired reset token with 400", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "a".repeat(64), password: "a-new-correct-password" });
    expect(res.status).toBe(400);
  });

  it("resets the password with a valid token and allows login with the new one", async () => {
    await request(app).post("/api/auth/register").send(credentials);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: credentials.email });
    const logged = logSpy.mock.calls.map((args) => args.join(" ")).join("\n");
    logSpy.mockRestore();

    const match = logged.match(/token=([a-f0-9]+)/);
    expect(match).not.toBeNull();
    const token = match[1];

    const newPassword = "a-new-correct-password";
    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: newPassword });
    expect(resetRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: newPassword });
    expect(newLoginRes.status).toBe(200);
  });

  it("rejects reusing the same reset token twice", async () => {
    await request(app).post("/api/auth/register").send(credentials);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: credentials.email });
    const logged = logSpy.mock.calls.map((args) => args.join(" ")).join("\n");
    logSpy.mockRestore();
    const token = logged.match(/token=([a-f0-9]+)/)[1];

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "first-new-password" });

    const secondAttempt = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "second-new-password" });
    expect(secondAttempt.status).toBe(400);
  });
});

describe("unknown routes", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});
