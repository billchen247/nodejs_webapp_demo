/**
 * @file tests/middleware.test.js
 * @author Bill Chen
 * @description Unit tests for `authenticate` and `requireRole` in isolation,
 *   using hand-built req/res/next doubles instead of going through
 *   supertest + the full Express app.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { authenticate } from "../src/middleware/authenticate.js";
import { requireRole } from "../src/middleware/requireRole.js";
import { User, ROLES } from "../src/models/User.js";
import { signAuthToken, AUTH_COOKIE_NAME } from "../src/config/auth.js";
import {
  startMemoryMongo,
  stopMemoryMongo,
  clearAllCollections,
} from "./setup.js";

beforeAll(async () => await startMemoryMongo());
afterAll(async () => await stopMemoryMongo());
beforeEach(async () => await clearAllCollections());

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("authenticate", () => {
  it("returns 401 when there is no token cookie", async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a malformed/invalid token", async () => {
    const req = { cookies: { [AUTH_COOKIE_NAME]: "not-a-real-jwt" } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the token's user no longer exists", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const token = signAuthToken(fakeId);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("populates req.user and calls next() for a valid token", async () => {
    const user = await User.create({
      name: "Grace Hopper",
      email: "grace@example.com",
      passwordHash: "irrelevant-for-this-test",
      role: ROLES.USER,
    });
    const token = signAuthToken(user._id);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      id: user._id.toString(),
      name: "Grace Hopper",
      email: "grace@example.com",
      role: ROLES.USER,
    });
    expect(res.statusCode).toBeNull();
  });
});

describe("requireRole", () => {
  it("returns 401 when req.user is missing (no authenticate ran)", () => {
    const guard = requireRole("admin");
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    guard(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the user's role is not in the allow-list", () => {
    const guard = requireRole("admin");
    const req = { user: { role: "user" } };
    const res = mockRes();
    const next = vi.fn();

    guard(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when the user's role is allowed", () => {
    const guard = requireRole("admin", "user");
    const req = { user: { role: "user" } };
    const res = mockRes();
    const next = vi.fn();

    guard(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
  });

  it("supports multiple allowed roles", () => {
    const guard = requireRole("admin", "editor");
    const req = { user: { role: "editor" } };
    const res = mockRes();
    const next = vi.fn();

    guard(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
