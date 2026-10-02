/**
 * @file tests/middleware.test.js
 * @author Bill Chen
 * @description Unit tests for the `authenticate` middleware, exercised
 *   directly (not through the full Express app) with hand-built
 *   req/res/next doubles.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { authenticate } from "../src/middleware/authenticate.js";
import { User } from "../src/models/User.js";
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

describe("authenticate middleware", () => {
  it("returns 401 and does not call next() when there is no token cookie", async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the cookies object itself is missing", async () => {
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a garbage/invalid token", async () => {
    const req = { cookies: { [AUTH_COOKIE_NAME]: "not-a-real-jwt" } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is valid but the user no longer exists", async () => {
    const token = signAuthToken("507f1f77bcf86cd799439011");
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets req.user and calls next() for a valid token", async () => {
    const user = await User.create({
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash: "irrelevant-for-this-test",
    });
    const token = signAuthToken(user._id);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
    expect(req.user).toEqual({
      id: user._id.toString(),
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });
});
