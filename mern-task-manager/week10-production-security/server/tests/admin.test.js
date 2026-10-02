/**
 * @file tests/admin.test.js
 * @author Bill Chen
 * @description Integration tests for the admin-only `/api/users` routes —
 *   `authenticate` + `requireRole("admin")`. There is no public API to
 *   promote a user (by design, see scripts/makeAdmin.js), so tests
 *   promote directly through the User model, the same way the
 *   make-admin script does.
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

async function registerAgent(email) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "correct-horse-123",
  });
  return { agent, user: res.body.user };
}

describe("GET /api/users", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for an authenticated non-admin", async () => {
    const { agent } = await registerAgent("regular@example.com");
    const res = await agent.get("/api/users");
    expect(res.status).toBe(403);
  });

  it("returns the user list for an admin, without password hashes", async () => {
    const { agent, user } = await registerAgent("admin@example.com");
    await User.findByIdAndUpdate(user.id, { role: ROLES.ADMIN });

    await registerAgent("someone-else@example.com");

    const res = await agent.get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    for (const u of res.body) {
      expect(u.passwordHash).toBeUndefined();
    }
  });
});

describe("GET /api/users/:id", () => {
  it("returns 403 for a non-admin even with a valid id", async () => {
    const { agent, user } = await registerAgent("regular@example.com");
    const res = await agent.get(`/api/users/${user.id}`);
    expect(res.status).toBe(403);
  });

  it("returns a single user for an admin", async () => {
    const { agent, user } = await registerAgent("admin@example.com");
    await User.findByIdAndUpdate(user.id, { role: ROLES.ADMIN });

    const res = await agent.get(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@example.com");
  });

  it("returns 400 for a malformed id", async () => {
    const { agent, user } = await registerAgent("admin@example.com");
    await User.findByIdAndUpdate(user.id, { role: ROLES.ADMIN });

    const res = await agent.get("/api/users/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed but unknown id", async () => {
    const { agent, user } = await registerAgent("admin@example.com");
    await User.findByIdAndUpdate(user.id, { role: ROLES.ADMIN });

    const res = await agent.get("/api/users/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });
});
