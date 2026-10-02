/**
 * @file tests/auth.test.js
 * @author Bill Chen
 * @description Integration tests for the Week 6 authentication API —
 *   register, login, logout, and /auth/me. These exercise the real
 *   HttpOnly cookie flow via a supertest agent, which persists cookies
 *   between requests the same way a browser would.
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

const credentials = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse",
};

// Pulls the raw Set-Cookie header for a given cookie name out of a
// supertest response, so we can assert on flags like HttpOnly directly.
function findSetCookie(res, name) {
  const header = res.headers["set-cookie"] || [];
  return header.find((c) => c.startsWith(`${name}=`));
}

describe("POST /api/auth/register", () => {
  it("creates a user, sets an HttpOnly cookie, and returns a safe user object", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: credentials.name,
      email: credentials.email,
    });
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookie = findSetCookie(res, "token");
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("rejects a password shorter than 8 characters with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...credentials, password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(credentials);
  });

  it("logs in with correct credentials and sets the auth cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(findSetCookie(res, "token")).toBeDefined();
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: credentials.password });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when there is no auth cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user when the auth cookie is present", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(credentials);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie so a later /me call is unauthenticated", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(credentials);
    expect((await agent.get("/api/auth/me")).status).toBe(200);

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    const cleared = findSetCookie(logoutRes, "token");
    expect(cleared).toBeDefined();
    expect(cleared).toMatch(/token=;/);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});
