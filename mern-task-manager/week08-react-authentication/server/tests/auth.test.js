/**
 * @file tests/auth.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 8 auth API — register, login,
 *   logout, and /me. These exercise the real Express app (via createApp())
 *   against an in-memory MongoDB.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import {
  startMemoryMongo,
  stopMemoryMongo,
  clearAllCollections,
} from "./setup.js";

const app = createApp();

beforeAll(async () => await startMemoryMongo());
afterAll(async () => await stopMemoryMongo());
beforeEach(async () => await clearAllCollections());

describe("GET /", () => {
  it("returns the Week 8 welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/week 8/i);
  });
});

describe("POST /api/auth/register", () => {
  it("creates a user, sets an auth cookie, and returns a safe user shape", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "supersecret",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Short Pw",
      email: "short@example.com",
      password: "short",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await User.create({
      name: "Existing",
      email: "dup@example.com",
      passwordHash: "irrelevant-hash",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "New Person",
      email: "dup@example.com",
      password: "supersecret",
    });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  async function registerUser(agent, overrides = {}) {
    return agent.post("/api/auth/register").send({
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "supersecret",
      ...overrides,
    });
  }

  it("logs in with correct credentials", async () => {
    await registerUser(request(app));

    const res = await request(app).post("/api/auth/login").send({
      email: "grace@example.com",
      password: "supersecret",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("grace@example.com");
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "whatever1",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong password with 401", async () => {
    await registerUser(request(app));

    const res = await request(app).post("/api/auth/login").send({
      email: "grace@example.com",
      password: "wrong-password",
    });
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
    await agent.post("/api/auth/register").send({
      name: "Margaret Hamilton",
      email: "margaret@example.com",
      password: "supersecret",
    });

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("margaret@example.com");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie so /me is 401 afterwards", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({
      name: "Katherine Johnson",
      email: "katherine@example.com",
      password: "supersecret",
    });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});
