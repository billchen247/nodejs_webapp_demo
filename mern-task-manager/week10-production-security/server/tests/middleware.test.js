/**
 * @file tests/middleware.test.js
 * @author Bill Chen
 * @description Unit tests for the three standalone middleware modules —
 *   `authenticate`, `requireRole`, and `validate` (runValidators) —
 *   exercised directly rather than through a full route, so failures
 *   point straight at the middleware instead of a whole request chain.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import express from "express";
import { body } from "express-validator";
import request from "supertest";
import { authenticate } from "../src/middleware/authenticate.js";
import { requireRole } from "../src/middleware/requireRole.js";
import { runValidators } from "../src/middleware/validate.js";
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
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("authenticate", () => {
  it("returns 401 when there is no cookie", async () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is garbage", async () => {
    const req = { cookies: { [AUTH_COOKIE_NAME]: "not-a-real-jwt" } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the token's user no longer exists", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const token = signAuthToken(fakeId);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("populates req.user and calls next for a valid token", async () => {
    const user = await User.create({
      name: "Grace Hopper",
      email: "grace@example.com",
      passwordHash: "x",
    });
    const token = signAuthToken(user._id);
    const req = { cookies: { [AUTH_COOKIE_NAME]: token } };
    const res = mockRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });
});

describe("requireRole", () => {
  it("returns 401 when req.user is missing (defensive check)", () => {
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the user's role is not in the allowed list", () => {
    const req = { user: { role: "user" } };
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the user's role is allowed", () => {
    const req = { user: { role: "admin" } };
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin", "user")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("validate (runValidators)", () => {
  // A minimal app wired with one validator chain is the simplest honest
  // way to exercise runValidators — express-validator stores its results
  // on the request via symbols that aren't practical to fake by hand.
  function buildTestApp() {
    const app = express();
    app.use(express.json());
    app.post(
      "/probe",
      body("title").isString().isLength({ min: 1 }).withMessage("title required"),
      runValidators,
      (req, res) => res.status(200).json({ ok: true }),
    );
    return app;
  }

  it("calls through to the handler when validation passes", async () => {
    const app = buildTestApp();
    const res = await request(app).post("/probe").send({ title: "fine" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("returns 400 with field-level errors when validation fails", async () => {
    const app = buildTestApp();
    const res = await request(app).post("/probe").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.errors[0]).toMatchObject({ field: "title" });
  });
});
