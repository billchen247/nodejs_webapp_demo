/**
 * @file tests/middleware.test.js
 * @author Bill Chen
 * @description Unit tests for the `authenticate` middleware in isolation,
 *   using mock `req`/`res`/`next` objects instead of a full HTTP request.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { authenticate } from "../src/middleware/authenticate.js";
import { signAuthToken, AUTH_COOKIE_NAME } from "../src/config/auth.js";
import { User } from "../src/models/User.js";
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
  it("responds 401 when there is no cookie", async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 when the token is invalid", async () => {
    const req = { cookies: { [AUTH_COOKIE_NAME]: "not-a-real-token" } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 when the token refers to a deleted user", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const token = signAuthToken(fakeId);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next() for a valid token", async () => {
    const user = await User.create({
      name: "Valid User",
      email: "valid@example.com",
      passwordHash: "irrelevant-hash",
    });
    const token = signAuthToken(user._id);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({
      id: user._id.toString(),
      name: "Valid User",
      email: "valid@example.com",
    });
  });
});
