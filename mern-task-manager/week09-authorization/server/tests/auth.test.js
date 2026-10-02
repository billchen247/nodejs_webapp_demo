/**
 * @file tests/auth.test.js
 * @author Bill Chen
 * @description Integration tests for register / login / logout / me.
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

const CREDENTIALS = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "supersecret",
};

describe("GET /", () => {
  it("returns the Week 9 welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/week 9/i);
  });
});

describe("POST /api/auth/register", () => {
  it("creates a user with role 'user' and sets an auth cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(CREDENTIALS);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: CREDENTIALS.name,
      email: CREDENTIALS.email,
      role: "user",
    });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("ignores a role sent by the client", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...CREDENTIALS, role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });

  it("rejects a missing name with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });
    expect(res.status).toBe(400);
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...CREDENTIALS, password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(CREDENTIALS);
    const res = await request(app).post("/api/auth/register").send(CREDENTIALS);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(CREDENTIALS);
  });

  it("logs in with correct credentials and sets a cookie", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: CREDENTIALS.email,
      password: CREDENTIALS.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(CREDENTIALS.email);
    expect(res.headers["set-cookie"][0]).toMatch(/^token=/);
  });

  it("rejects a missing email or password with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: CREDENTIALS.email });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: CREDENTIALS.password });
    expect(res.status).toBe(401);
  });

  it("rejects an incorrect password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: CREDENTIALS.email, password: "wrong-password" });
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
    await agent.post("/api/auth/register").send(CREDENTIALS);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: CREDENTIALS.name,
      email: CREDENTIALS.email,
      role: "user",
    });
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie so /me is unauthenticated afterwards", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(CREDENTIALS);
    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ ok: true });

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });
});

describe("unknown routes", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});

// Sanity check that User docs really land in the DB (used by other suites).
describe("User model", () => {
  it("hashes passwords, never storing the plaintext", async () => {
    await request(app).post("/api/auth/register").send(CREDENTIALS);
    const stored = await User.findOne({ email: CREDENTIALS.email }).select("+passwordHash");
    expect(stored.passwordHash).not.toBe(CREDENTIALS.password);
  });
});
