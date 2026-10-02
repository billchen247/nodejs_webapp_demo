/**
 * @file tests/admin.test.js
 * @author Bill Chen
 * @description Integration tests for the admin-only `/api/users` endpoints.
 *   There is no HTTP path to self-promote, so tests promote a user to
 *   admin directly through the model — the same thing `scripts/makeAdmin.js`
 *   does.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User, ROLES } from "../src/models/User.js";
import {
  startMemoryMongo,
  stopMemoryMongo,
  clearAllCollections,
} from "./setup.js";

const app = createApp();

beforeAll(async () => await startMemoryMongo());
afterAll(async () => await stopMemoryMongo());
beforeEach(async () => await clearAllCollections());

async function registerAgent(email, { admin = false } = {}) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "supersecret",
  });
  if (admin) {
    await User.findOneAndUpdate({ email }, { role: ROLES.ADMIN });
    // Re-authenticate so the fresh cookie's session reflects the
    // promoted role (authenticate reloads the user from the DB on every
    // request anyway, but logging in again mirrors the real flow).
    await agent.post("/api/auth/login").send({ email, password: "supersecret" });
  }
  return agent;
}

describe("GET /api/users", () => {
  it("returns 401 for an unauthenticated request", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for an authenticated non-admin user", async () => {
    const user = await registerAgent("user@example.com");
    const res = await user.get("/api/users");
    expect(res.status).toBe(403);
  });

  it("returns 200 with safe user JSON for an admin", async () => {
    await registerAgent("someone@example.com");
    const admin = await registerAgent("admin@example.com", { admin: true });

    const res = await admin.get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    for (const user of res.body) {
      expect(user).not.toHaveProperty("passwordHash");
      expect(user).toHaveProperty("role");
    }
  });
});

describe("GET /api/users/:id", () => {
  it("returns 403 for a non-admin", async () => {
    const user = await registerAgent("user@example.com");
    const res = await user.get(`/api/users/507f1f77bcf86cd799439011`);
    expect(res.status).toBe(403);
  });

  it("returns 400 for a malformed id as an admin", async () => {
    const admin = await registerAgent("admin@example.com", { admin: true });
    const res = await admin.get("/api/users/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id as an admin", async () => {
    const admin = await registerAgent("admin@example.com", { admin: true });
    const res = await admin.get("/api/users/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("returns the user as an admin", async () => {
    await registerAgent("plain@example.com");
    const plain = await User.findOne({ email: "plain@example.com" });
    const admin = await registerAgent("admin@example.com", { admin: true });

    const res = await admin.get(`/api/users/${plain._id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("plain@example.com");
    expect(res.body).not.toHaveProperty("passwordHash");
  });
});
