/* ---------------------------------------------------------------------------
 * test/auth.test.ts
 *
 * Signup, login, logout, and the "requireAuth" guard.
 * -------------------------------------------------------------------------*/

import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Express } from "express";

import { createApp } from "../src/app.js";
import { UserModel } from "../src/models/user.js";
import { ProjectModel } from "../src/models/project.js";
import { TaskModel } from "../src/models/task.js";

let mongod: MongoMemoryServer;
let app: Express;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await Promise.all([
        UserModel.deleteMany({}),
        ProjectModel.deleteMany({}),
        TaskModel.deleteMany({}),
    ]);
});

describe("GET /signup", () => {
    it("renders the signup form", async () => {
        const res = await request(app).get("/signup");
        expect(res.status).toBe(200);
        expect(res.text).toContain('<form method="post" action="/signup"');
        expect(res.text).toContain('name="email"');
        expect(res.text).toContain('name="password"');
    });
});

describe("POST /signup", () => {
    it("creates an account, logs the user in, and redirects to /projects", async () => {
        const res = await request(app)
            .post("/signup")
            .type("form")
            .send({
                name: "Ada Lovelace",
                email: "ada@example.com",
                password: "hunter22!",
                confirmPassword: "hunter22!",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/projects");
        expect(res.headers["set-cookie"]?.some((c) => c.startsWith("tm.sid="))).toBe(true);

        const user = await UserModel.findByEmail("ada@example.com").select("+passwordHash");
        expect(user).not.toBeNull();
        expect(user?.name).toBe("Ada Lovelace");
        // passwordHash is set and is NOT the plaintext.
        expect(user?.passwordHash).toBeDefined();
        expect(user?.passwordHash).not.toBe("hunter22!");
    });

    it("re-renders the form with per-field errors on bad input", async () => {
        const res = await request(app)
            .post("/signup")
            .type("form")
            .send({ name: "", email: "not-an-email", password: "short" });

        expect(res.status).toBe(400);
        expect(res.text).toContain("Name cannot be empty");
        expect(res.text).toContain("Email format looks wrong");
        expect(res.text).toContain("Password must be at least 8 characters");
        expect(await UserModel.countDocuments()).toBe(0);
    });

    it("rejects a duplicate email", async () => {
        const existing = new UserModel({ name: "Bob", email: "bob@example.com" });
        await (existing as any).setPassword("password1");
        await existing.save();

        const res = await request(app)
            .post("/signup")
            .type("form")
            .send({
                name: "Also Bob",
                email: "bob@example.com",
                password: "another123",
                confirmPassword: "another123",
            });

        expect(res.status).toBe(400);
        expect(res.text).toContain("already exists");
    });

    it("rejects mismatched password confirmation", async () => {
        const res = await request(app)
            .post("/signup")
            .type("form")
            .send({
                name: "Bob",
                email: "bob@example.com",
                password: "password1",
                confirmPassword: "different1",
            });
        expect(res.status).toBe(400);
        expect(res.text).toContain("Passwords do not match");
    });
});

describe("POST /login", () => {
    beforeEach(async () => {
        const u = new UserModel({ name: "Grace", email: "grace@example.com" });
        await (u as any).setPassword("compilers");
        await u.save();
    });

    it("logs the user in with correct credentials", async () => {
        const res = await request(app)
            .post("/login")
            .type("form")
            .send({ email: "grace@example.com", password: "compilers" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/projects");
    });

    it("rejects a wrong password with a generic message", async () => {
        const res = await request(app)
            .post("/login")
            .type("form")
            .send({ email: "grace@example.com", password: "wrong-pw!" });
        expect(res.status).toBe(400);
        expect(res.text).toContain("Email or password is incorrect");
    });

    it("returns the same generic error for an unknown email", async () => {
        const res = await request(app)
            .post("/login")
            .type("form")
            .send({ email: "nobody@example.com", password: "compilers" });
        expect(res.status).toBe(400);
        expect(res.text).toContain("Email or password is incorrect");
    });
});

describe("POST /logout", () => {
    it("destroys the session and clears the cookie", async () => {
        const agent = request.agent(app);
        await agent
            .post("/signup")
            .type("form")
            .send({
                name: "Ada",
                email: "ada@example.com",
                password: "password1",
                confirmPassword: "password1",
            });

        const before = await agent.get("/projects");
        expect(before.status).toBe(200);

        const out = await agent.post("/logout");
        expect(out.status).toBe(302);
        expect(out.headers.location).toBe("/");

        const after = await agent.get("/projects");
        expect(after.status).toBe(302);
        expect(after.headers.location).toBe("/login");
    });
});

describe("requireAuth guard", () => {
    it("redirects /projects to /login when anonymous", async () => {
        const res = await request(app).get("/projects");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    it("redirects /users to /login when anonymous", async () => {
        const res = await request(app).get("/users");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    it("leaves /todos open (legacy demo)", async () => {
        const res = await request(app).get("/todos");
        expect(res.status).toBe(200);
    });
});
