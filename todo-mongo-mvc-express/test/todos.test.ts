/* ---------------------------------------------------------------------------
 * test/todos.test.ts
 *
 * Integration tests for the MVC Todo app. Exercises real HTTP against the
 * built Express app, backed by an in-process `mongodb-memory-server`.
 *
 * We assert on the rendered HTML with plain string checks rather than a real
 * DOM parser — it's crude, but it keeps the test surface tiny and makes the
 * assertions read like documentation for the view.
 * -------------------------------------------------------------------------*/

import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Express } from "express";

import { createApp } from "../src/app.js";
import { TodoModel } from "../src/models/todo.js";

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
    await TodoModel.deleteMany({});
});

describe("Home page GET /", () => {
    it("renders the landing page with counts", async () => {
        await TodoModel.create({ title: "seed one", completed: false });
        await TodoModel.create({ title: "seed two", completed: true });

        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
        expect(res.text).toContain("Task Manager");
        // The legacy todo count of 2 should render somewhere on the page.
        expect(res.text).toMatch(/stat-value">\s*2\s*</);
    });
});

describe("GET /todos", () => {
    it("shows an empty state when no todos exist", async () => {
        const res = await request(app).get("/todos");
        expect(res.status).toBe(200);
        expect(res.text).toContain("No todos yet");
    });

    it("lists newest-first", async () => {
        await TodoModel.create({ title: "older", createdAt: new Date(2024, 0, 1) });
        // brief delay so createdAt strictly increases
        await new Promise((r) => setTimeout(r, 5));
        await TodoModel.create({ title: "newer" });

        const res = await request(app).get("/todos");
        expect(res.status).toBe(200);
        expect(res.text.indexOf("newer")).toBeLessThan(res.text.indexOf("older"));
    });

    it("filters by ?filter=active", async () => {
        await TodoModel.create({ title: "task-A", completed: false });
        await TodoModel.create({ title: "task-B", completed: true });

        const res = await request(app).get("/todos?filter=active");
        expect(res.status).toBe(200);
        expect(res.text).toContain("task-A");
        expect(res.text).not.toContain("task-B");
    });

    it("filters by ?filter=completed", async () => {
        await TodoModel.create({ title: "task-A", completed: false });
        await TodoModel.create({ title: "task-B", completed: true });

        const res = await request(app).get("/todos?filter=completed");
        expect(res.status).toBe(200);
        expect(res.text).not.toContain("task-A");
        expect(res.text).toContain("task-B");
    });
});

describe("GET /todos/new", () => {
    it("renders an empty create form", async () => {
        const res = await request(app).get("/todos/new");
        expect(res.status).toBe(200);
        expect(res.text).toContain('<form method="post" action="/todos"');
        expect(res.text).toContain('name="title"');
    });
});

describe("POST /todos", () => {
    it("creates a todo from urlencoded form data and redirects to /todos", async () => {
        const res = await request(app)
            .post("/todos")
            .type("form")
            .send({ title: "buy milk" });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/todos");

        const found = await TodoModel.findOne({ title: "buy milk" });
        expect(found).not.toBeNull();
        expect(found?.completed).toBe(false);
    });

    it("re-renders the form with an error when title is empty", async () => {
        const res = await request(app)
            .post("/todos")
            .type("form")
            .send({ title: "" });

        expect(res.status).toBe(400);
        expect(res.text).toContain("Title cannot be empty");
        expect(await TodoModel.countDocuments()).toBe(0);
    });

    it("treats an unchecked checkbox as completed=false", async () => {
        const res = await request(app)
            .post("/todos")
            .type("form")
            .send({ title: "no checkbox" });
        expect(res.status).toBe(302);
        const found = await TodoModel.findOne({ title: "no checkbox" });
        expect(found?.completed).toBe(false);
    });

    it("treats a checked checkbox (value 'on') as completed=true", async () => {
        const res = await request(app)
            .post("/todos")
            .type("form")
            .send({ title: "already done", completed: "on" });
        expect(res.status).toBe(302);
        const found = await TodoModel.findOne({ title: "already done" });
        expect(found?.completed).toBe(true);
    });
});

describe("GET /todos/:id", () => {
    it("renders a single todo's detail page", async () => {
        const t = await TodoModel.create({ title: "read a book" });
        const res = await request(app).get(`/todos/${t.id}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("read a book");
        expect(res.text).toContain(String(t.id));
    });

    it("returns a 400 error page when the id is malformed", async () => {
        const res = await request(app).get("/todos/not-an-object-id");
        expect(res.status).toBe(400);
        expect(res.text).toContain("Invalid Todo ID");
    });

    it("returns a 404 error page when the id doesn't exist", async () => {
        const fresh = new mongoose.Types.ObjectId().toString();
        const res = await request(app).get(`/todos/${fresh}`);
        expect(res.status).toBe(404);
        expect(res.text).toContain("Todo not found");
    });
});

describe("GET /todos/:id/edit", () => {
    it("renders the edit form pre-populated", async () => {
        const t = await TodoModel.create({ title: "edit me" });
        const res = await request(app).get(`/todos/${t.id}/edit`);
        expect(res.status).toBe(200);
        expect(res.text).toContain('value="edit me"');
    });
});

describe("PUT /todos/:id (via method-override)", () => {
    it("updates the title and redirects", async () => {
        const t = await TodoModel.create({ title: "old title" });

        const res = await request(app)
            .post(`/todos/${t.id}?_method=PUT`)
            .type("form")
            .send({ title: "new title", completed: "on" });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/todos");

        const found = await TodoModel.findById(t.id);
        expect(found?.title).toBe("new title");
        expect(found?.completed).toBe(true);
    });

    it("re-renders the edit form with an error on invalid input", async () => {
        const t = await TodoModel.create({ title: "keep me" });
        const res = await request(app)
            .post(`/todos/${t.id}?_method=PUT`)
            .type("form")
            .send({ title: "" });
        expect(res.status).toBe(400);
        expect(res.text).toContain("Title cannot be empty");

        // Unchanged in DB
        const found = await TodoModel.findById(t.id);
        expect(found?.title).toBe("keep me");
    });
});

describe("POST /todos/:id/toggle", () => {
    it("flips the completed flag", async () => {
        const t = await TodoModel.create({ title: "toggle me", completed: false });
        const res = await request(app).post(`/todos/${t.id}/toggle`);
        expect(res.status).toBe(302);

        const flipped = await TodoModel.findById(t.id);
        expect(flipped?.completed).toBe(true);
    });
});

describe("DELETE /todos/:id (via method-override)", () => {
    it("deletes the todo and redirects", async () => {
        const t = await TodoModel.create({ title: "goodbye" });
        const res = await request(app).post(`/todos/${t.id}?_method=DELETE`);
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/todos");
        expect(await TodoModel.findById(t.id)).toBeNull();
    });
});

describe("404 handler", () => {
    it("renders a friendly 404 page for unknown routes", async () => {
        const res = await request(app).get("/does-not-exist");
        expect(res.status).toBe(404);
        expect(res.text).toContain("Not found");
        expect(res.text).toContain("/does-not-exist");
    });
});
