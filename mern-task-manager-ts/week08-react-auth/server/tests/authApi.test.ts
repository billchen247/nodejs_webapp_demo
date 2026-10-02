/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: server/tests/authApi.test.ts
 *
 * Integration tests for register / login / logout / me.
 *
 * We use Supertest's `agent()` so cookies set by the server are
 * automatically re-sent on later requests — exactly like a real browser.
 */
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { AUTH_COOKIE_NAME } from "../src/auth/cookie.js";

const app = createApp({ clientUrl: "http://localhost:5173" });

const good = { email: "ada@example.com", password: "correct horse battery staple", name: "Ada" };

describe("POST /api/auth/register", () => {
  it("creates a user, hashes the password, and sets the auth cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(good);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.id).toBeTruthy();
    // The hash must NOT be in the response body.
    expect(res.body.user.passwordHash).toBeUndefined();

    // The hash *is* in the database, and it is bcrypt-shaped.
    const stored = await User.findOne({ email: "ada@example.com" }).select("+passwordHash");
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored!.passwordHash).not.toBe(good.password);

    // The Set-Cookie header carries the auth cookie, marked HttpOnly.
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))).toBe(true);
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
  });

  it("rejects a missing email with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ password: "abcdefgh" });
    expect(res.status).toBe(400);
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "x@example.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(good);
    const res = await request(app).post("/api/auth/register").send(good);
    expect(res.status).toBe(409);
  });

  it("lowercases the stored email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "MIXED@Example.COM", password: "abcdefgh" });
    const stored = await User.findOne({ email: "mixed@example.com" });
    expect(stored).not.toBeNull();
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and sets the auth cookie", async () => {
    await request(app).post("/api/auth/register").send(good);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: good.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(good.email);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`))).toBe(true);
  });

  it("returns 401 for an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "no-one@example.com", password: "whatever123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("returns 401 for a bad password", async () => {
    await request(app).post("/api/auth/register").send(good);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: "wrong-wrong-wrong" });
    expect(res.status).toBe(401);
  });

  it("gives the same error for unknown email and bad password", async () => {
    await request(app).post("/api/auth/register").send(good);
    const bad1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "anything1" });
    const bad2 = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: "wrong-wrong" });
    expect(bad1.body.error).toBe(bad2.body.error);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the user when the cookie is valid", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(good);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(good.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("returns { user: null } when no cookie is present", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it("returns { user: null } for a tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE_NAME}=not-a-real-jwt`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(good);
    // Confirm we are logged in.
    const before = await agent.get("/api/auth/me");
    expect(before.body.user?.email).toBe(good.email);

    const out = await agent.post("/api/auth/logout");
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ ok: true });

    const after = await agent.get("/api/auth/me");
    expect(after.body).toEqual({ user: null });
  });

  it("succeeds even if the user was never logged in", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});
