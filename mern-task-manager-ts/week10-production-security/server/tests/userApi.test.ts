/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/tests/userApi.test.ts
 *
 * Authorization tests for the admin-only /api/users routes.
 *
 * The three scenarios every admin route must survive:
 *   - Unauthenticated         → 401
 *   - Authenticated normal    → 403
 *   - Authenticated admin     → 200 / 201 / 204
 *
 * We assemble the test cast with Supertest `agent()` + the real
 * `createApp()`. Admins are produced by registering a user and
 * promoting them directly in Mongo (the public API does not expose a
 * way to self-promote — that is the entire point).
 */
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";

const app = createApp({ clientUrl: "http://localhost:5173" });

async function makeUser(email: string) {
  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/register")
    .send({ email, password: "correct horse battery", name: email });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body.user as { id: string; role: string } };
}

async function makeAdmin(email: string) {
  const { agent, user } = await makeUser(email);
  // Promote directly in the database to simulate the seed-admin bootstrap.
  await User.findByIdAndUpdate(user.id, { role: "admin" });
  return { agent, userId: user.id };
}

describe("GET /api/users (admin only)", () => {
  it("returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for an authenticated normal user", async () => {
    const { agent } = await makeUser("alice@example.com");
    const res = await agent.get("/api/users");
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it("returns the user list for an admin", async () => {
    await makeUser("bob@example.com");
    const { agent } = await makeAdmin("admin@example.com");
    const res = await agent.get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // The admin itself plus Bob.
    expect(res.body.length).toBe(2);
    // The hash is never on the wire.
    for (const u of res.body) {
      expect(u.passwordHash).toBeUndefined();
      expect(["user", "admin"]).toContain(u.role);
    }
  });
});

describe("GET /api/users/:id (admin only)", () => {
  it("returns the user when the caller is an admin", async () => {
    const { user: alice } = await makeUser("alice2@example.com");
    const { agent } = await makeAdmin("admin2@example.com");
    const res = await agent.get(`/api/users/${alice.id}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("alice2@example.com");
  });

  it("returns 404 for an unknown id", async () => {
    const { agent } = await makeAdmin("admin3@example.com");
    const res = await agent.get("/api/users/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid ObjectId", async () => {
    const { agent } = await makeAdmin("admin4@example.com");
    const res = await agent.get("/api/users/not-an-id");
    expect(res.status).toBe(400);
  });

  it("returns 403 for a normal user", async () => {
    const { user: alice } = await makeUser("alice3@example.com");
    const { agent } = await makeUser("eve@example.com");
    const res = await agent.get(`/api/users/${alice.id}`);
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/users/:id — role changes", () => {
  it("an admin can promote a normal user", async () => {
    const { user: bob } = await makeUser("bob2@example.com");
    const { agent } = await makeAdmin("admin5@example.com");

    const res = await agent.patch(`/api/users/${bob.id}`).send({ role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");

    const refreshed = await User.findById(bob.id);
    expect(refreshed?.role).toBe("admin");
  });

  it("rejects an invalid role string with 400", async () => {
    const { user: bob } = await makeUser("bob3@example.com");
    const { agent } = await makeAdmin("admin6@example.com");

    const res = await agent.patch(`/api/users/${bob.id}`).send({ role: "superuser" });
    expect(res.status).toBe(400);
  });

  it("admin cannot demote themselves", async () => {
    const { agent, userId } = await makeAdmin("admin7@example.com");
    const res = await agent.patch(`/api/users/${userId}`).send({ role: "user" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/demote themselves/i);
  });

  it("a normal user cannot promote anyone", async () => {
    const { user: target } = await makeUser("target@example.com");
    const { agent } = await makeUser("eve2@example.com");
    const res = await agent.patch(`/api/users/${target.id}`).send({ role: "admin" });
    expect(res.status).toBe(403);
  });
});

describe("Register endpoint rejects client-sent role", () => {
  it("a visitor cannot register as admin — zod strict rejects the extra field", async () => {
    // In Week 9 this request succeeded and the extra `role` field was
    // silently ignored. Week 10's `strict()` schema is louder: the
    // unknown field itself is a validation error, so the request fails
    // with 400 and never reaches the controller.
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "sneaky@example.com",
        password: "longenough-pw",
        role: "admin",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);

    // Nothing was written to the database.
    const stored = await User.findOne({ email: "sneaky@example.com" });
    expect(stored).toBeNull();
  });

  it("a well-formed register leaves role at the safe default", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "fresh@example.com", password: "longenough-pw" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });
});
