/**
 * @file tests/auth.test.js
 * @author Bill Chen
 * @description Integration tests for register / login / logout / me.
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

describe("POST /api/auth/register", () => {
  it("creates a user, hides the password hash, and sets an auth cookie", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "super-secret-1",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.name).toBe("Ada Lovelace");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects a password shorter than 8 characters with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "ada2@example.com",
      password: "short",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a missing name with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "noname@example.com",
      password: "super-secret-1",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "dup@example.com",
      password: "super-secret-1",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada Again",
      email: "dup@example.com",
      password: "super-secret-1",
    });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "super-secret-1",
    });
  });

  it("logs in with correct credentials and sets an auth cookie", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "grace@example.com",
      password: "super-secret-1",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("grace@example.com");
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nope@example.com",
      password: "whatever123",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "grace@example.com",
      password: "totally-wrong",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a missing password with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "grace@example.com",
    });
    expect(res.status).toBe(400);
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
      name: "Linus Torvalds",
      email: "linus@example.com",
      password: "super-secret-1",
    });

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("linus@example.com");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie so the session no longer authenticates", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({
      name: "Margaret Hamilton",
      email: "margaret@example.com",
      password: "super-secret-1",
    });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ ok: true });

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});
