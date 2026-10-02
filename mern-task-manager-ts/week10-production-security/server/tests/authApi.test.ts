/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/tests/authApi.test.ts
 *
 * Integration tests for the auth surface, now including:
 *   - Zod-validated error responses on bad input.
 *   - `/refresh` round-tripping a refresh cookie into a fresh access cookie.
 *   - `/forgot-password` returning 200 even for unknown emails
 *     (anti-enumeration), and `/reset-password` consuming the token.
 *
 * We use Supertest's `agent()` so cookies set by the server are
 * automatically re-sent on later requests — exactly like a real browser.
 */
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../src/auth/cookie.js";

const app = createApp({ clientUrl: "http://localhost:5173" });

const good = { email: "ada@example.com", password: "correct horse battery staple", name: "Ada" };

function cookieHeader(res: request.Response, name: string): string | undefined {
  const raw = res.headers["set-cookie"] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith(`${name}=`));
}

describe("POST /api/auth/register", () => {
  it("creates a user, hashes the password, and sets access + refresh cookies", async () => {
    const res = await request(app).post("/api/auth/register").send(good);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.role).toBe("user");
    expect(res.body.user.id).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();

    const stored = await User.findOne({ email: "ada@example.com" }).select("+passwordHash");
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).toMatch(/^\$2[aby]\$/);

    // Both cookies are set and HttpOnly.
    const access = cookieHeader(res, ACCESS_COOKIE_NAME);
    const refresh = cookieHeader(res, REFRESH_COOKIE_NAME);
    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();
    expect(/HttpOnly/i.test(access!)).toBe(true);
    expect(/HttpOnly/i.test(refresh!)).toBe(true);
    // The refresh cookie is scoped to /api/auth so it never travels with /api/tasks.
    expect(/Path=\/api\/auth/i.test(refresh!)).toBe(true);
  });

  it("ignores any `role` field in the request body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...good, role: "admin" });

    // zod strict() rejects unknown fields — register cannot grant admin.
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
  });

  it("rejects a missing email with a structured validation error", async () => {
    const res = await request(app).post("/api/auth/register").send({ password: "abcdefgh" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
    expect(res.body.details).toBeTypeOf("object");
    expect(res.body.details.email).toBeTruthy();
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "x@example.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.details.password).toMatch(/8/);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(good);
    const res = await request(app).post("/api/auth/register").send(good);
    expect(res.status).toBe(409);
  });

  it("lowercases + trims the stored email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "  MIXED@Example.COM  ", password: "abcdefgh" });
    const stored = await User.findOne({ email: "mixed@example.com" });
    expect(stored).not.toBeNull();
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and sets both auth cookies", async () => {
    await request(app).post("/api/auth/register").send(good);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: good.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(good.email);
    expect(cookieHeader(res, ACCESS_COOKIE_NAME)).toBeTruthy();
    expect(cookieHeader(res, REFRESH_COOKIE_NAME)).toBeTruthy();
  });

  it("gives the same error body for unknown email and bad password", async () => {
    await request(app).post("/api/auth/register").send(good);
    const bad1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "anything1" });
    const bad2 = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: "wrong-wrong" });

    expect(bad1.status).toBe(401);
    expect(bad2.status).toBe(401);
    expect(bad1.body.error).toBe(bad2.body.error);
  });
});

describe("GET /api/auth/me", () => {
  it("returns { user: null } when no cookie is present", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it("returns { user: null } for a tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${ACCESS_COOKIE_NAME}=not-a-real-jwt`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it("returns the user when the cookie is valid", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(good);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(good.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.resetTokenHash).toBeUndefined();
  });
});

describe("POST /api/auth/refresh", () => {
  it("mints a new access cookie from the refresh cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(good);

    const res = await agent.post("/api/auth/refresh").send();
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(good.email);
    // Fresh Set-Cookie carries a new access token.
    expect(cookieHeader(res, ACCESS_COOKIE_NAME)).toBeTruthy();
  });

  it("returns 401 when no refresh cookie is present", async () => {
    const res = await request(app).post("/api/auth/refresh").send();
    expect(res.status).toBe(401);
  });

  it("rejects an access token offered as a refresh token", async () => {
    // The register flow leaves BOTH cookies in the jar. If we extract the
    // access token and present it on `/refresh`, the `typ` claim should
    // make it fail — a strong defence against cookie-swap attacks.
    const reg = await request(app).post("/api/auth/register").send(good);
    const access = cookieHeader(reg, ACCESS_COOKIE_NAME)!;
    const accessValue = access.split(";")[0].split("=")[1];

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE_NAME}=${accessValue}`);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears both auth cookies", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(good);

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

describe("POST /api/auth/forgot-password", () => {
  it("responds 200 for an unknown email (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "never-registered@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // No devToken when the user does not exist — otherwise it would still
    // leak existence information in dev.
    expect(res.body.devToken).toBeUndefined();
  });

  it("stores a reset token hash and returns the plaintext in dev", async () => {
    await request(app).post("/api/auth/register").send(good);
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: good.email });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.devToken).toBe("string");
    expect(res.body.devToken.length).toBeGreaterThan(20);

    const stored = await User.findOne({ email: good.email }).select(
      "+resetTokenHash +resetTokenExpiresAt",
    );
    expect(stored!.get("resetTokenHash")).toBeTruthy();
    const exp = stored!.get("resetTokenExpiresAt") as Date;
    expect(exp.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("POST /api/auth/reset-password", () => {
  async function obtainToken(): Promise<string> {
    await request(app).post("/api/auth/register").send(good);
    const r = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: good.email });
    return r.body.devToken as string;
  }

  it("changes the password when the token is valid", async () => {
    const token = await obtainToken();
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "a-brand-new-password" });
    expect(res.status).toBe(200);

    // Old password no longer works.
    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: good.password });
    expect(bad.status).toBe(401);

    // New password works.
    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: good.email, password: "a-brand-new-password" });
    expect(ok.status).toBe(200);
  });

  it("rejects a reused token (single-use)", async () => {
    const token = await obtainToken();
    const first = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "a-brand-new-password" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "yet-another-password" });
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/invalid|expired/i);
  });

  it("rejects an unknown token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "a".repeat(40), newPassword: "any-good-password" });
    expect(res.status).toBe(400);
  });
});
