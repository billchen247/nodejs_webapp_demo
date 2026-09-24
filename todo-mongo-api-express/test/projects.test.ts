/* =============================================================================
 * test/projects.test.ts — integration tests for the Task-Manager Project resource
 * =============================================================================
 *
 * Added test-first (TDD Slice B). Same conventions as server.test.ts:
 *   * MongoMemoryServer boots once, collections cleared between tests.
 *   * supertest exercises the assembled Express app in-process.
 * ===========================================================================
 * @author Bill Chen
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectToDatabase, disconnectFromDatabase } from "../src/db.js";
import { ProjectModel } from "../src/models/projects.js";
import { TodoModel } from "../src/models/todos.js";

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectToDatabase(mongo.getUri());
});

afterAll(async () => {
    await disconnectFromDatabase();
    await mongo.stop();
});

beforeEach(async () => {
    await ProjectModel.deleteMany({});
    await TodoModel.deleteMany({});
});

/* ---------------------------------------------------------------------------
 * POST /api/projects
 * -------------------------------------------------------------------------*/

describe("POST /api/projects", () => {
    test("creates a project and returns 201 with the created record", async () => {
        const res = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .send({ name: "Inbox" });

        expect(res.status).toBe(201);
        expect(typeof res.body.id).toBe("string");
        expect(res.body.name).toBe("Inbox");
        expect(res.body.createdAt).toBeTruthy();
        expect(res.body.updatedAt).toBeTruthy();
        // toJSON transform strips Mongo internals.
        expect(res.body._id).toBeUndefined();
        expect(res.body.__v).toBeUndefined();
    });

    test("returns 400 when name is missing", async () => {
        const res = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/name/i);
    });

    test("returns 400 when name is whitespace-only", async () => {
        const res = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .send({ name: "   " });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/name/i);
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/projects
 * -------------------------------------------------------------------------*/

async function seedTwoProjects() {
    const a = await ProjectModel.create({ name: "Inbox" });
    const b = await ProjectModel.create({ name: "Work" });
    return { a, b };
}

describe("GET /api/projects", () => {
    test("returns an empty array when the collection is empty", async () => {
        const res = await request(app).get("/api/projects");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toEqual([]);
    });

    test("returns all projects, oldest first", async () => {
        await seedTwoProjects();
        const res = await request(app).get("/api/projects");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe("Inbox");
        expect(res.body[1].name).toBe("Work");
        expect(typeof res.body[0].id).toBe("string");
        expect(res.body[0]._id).toBeUndefined();
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/projects/:id
 * -------------------------------------------------------------------------*/

describe("GET /api/projects/:id", () => {
    test("returns the specific project when it exists", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app).get(`/api/projects/${a.id}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(a.id);
        expect(res.body.name).toBe("Inbox");
    });

    test("returns 404 for a well-formed but unknown id", async () => {
        const res = await request(app).get("/api/projects/000000000000000000000000");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Project not found");
    });

    test("returns 400 when the id is not a 24-char hex string", async () => {
        const res = await request(app).get("/api/projects/not-an-oid");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid Project ID");
    });
});

/* ---------------------------------------------------------------------------
 * PUT /api/projects/:id
 * -------------------------------------------------------------------------*/

describe("PUT /api/projects/:id", () => {
    test("updates the name and returns the updated project", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app)
            .put(`/api/projects/${a.id}`)
            .set("Content-Type", "application/json")
            .send({ name: "Personal" });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(a.id);
        expect(res.body.name).toBe("Personal");
    });

    test("returns 404 when the project does not exist", async () => {
        const res = await request(app)
            .put("/api/projects/000000000000000000000000")
            .set("Content-Type", "application/json")
            .send({ name: "nope" });
        expect(res.status).toBe(404);
    });

    test("returns 400 when name is empty/whitespace-only", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app)
            .put(`/api/projects/${a.id}`)
            .set("Content-Type", "application/json")
            .send({ name: "   " });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/name/i);
    });

    test("ignores unknown fields", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app)
            .put(`/api/projects/${a.id}`)
            .set("Content-Type", "application/json")
            .send({ name: "keep", extra: "ignored", id: "hacked" });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("keep");
        expect(res.body.id).toBe(a.id);
    });
});

/* ---------------------------------------------------------------------------
 * DELETE /api/projects/:id
 * -------------------------------------------------------------------------*/

describe("DELETE /api/projects/:id", () => {
    test("removes the project and returns 204 with no body", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app).delete(`/api/projects/${a.id}`);
        expect(res.status).toBe(204);
        expect(res.text).toBe("");

        const followUp = await request(app).get(`/api/projects/${a.id}`);
        expect(followUp.status).toBe(404);
    });

    test("returns 404 when the project does not exist", async () => {
        const res = await request(app).delete("/api/projects/000000000000000000000000");
        expect(res.status).toBe(404);
    });
});

/* ---------------------------------------------------------------------------
 * Todo.projectId foreign key
 * -------------------------------------------------------------------------*/

describe("POST /api/todos with projectId", () => {
    test("creates a todo linked to an existing project", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({ title: "Buy milk", projectId: a.id });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Buy milk");
        expect(res.body.projectId).toBe(a.id);
    });

    test("returns 404 when projectId points to a non-existent project", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({ title: "orphan", projectId: "000000000000000000000000" });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Project not found");
    });

    test("returns 400 when projectId is malformed", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({ title: "orphan", projectId: "not-an-oid" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/projectId/i);
    });

    test("creating a todo without projectId still works (backwards-compatible)", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({ title: "loose task" });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("loose task");
        expect(res.body.projectId).toBeUndefined();
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/projects/:id/tasks
 * -------------------------------------------------------------------------*/

describe("GET /api/projects/:id/tasks", () => {
    test("returns only the tasks that belong to the project", async () => {
        const { a, b } = await seedTwoProjects();
        await TodoModel.create({ title: "in-a-1", projectId: a.id });
        await TodoModel.create({ title: "in-a-2", projectId: a.id });
        await TodoModel.create({ title: "in-b", projectId: b.id });
        await TodoModel.create({ title: "orphan" });

        const res = await request(app).get(`/api/projects/${a.id}/tasks`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body.map((t: { title: string }) => t.title).sort())
            .toEqual(["in-a-1", "in-a-2"]);
        expect(res.body[0].projectId).toBe(a.id);
    });

    test("returns an empty array when the project has no tasks", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app).get(`/api/projects/${a.id}/tasks`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("returns 404 for a well-formed but unknown project id", async () => {
        const res = await request(app).get(
            "/api/projects/000000000000000000000000/tasks"
        );
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Project not found");
    });

    test("returns 400 for a malformed project id", async () => {
        const res = await request(app).get("/api/projects/not-an-oid/tasks");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid Project ID");
    });
});

/* ---------------------------------------------------------------------------
 * POST /api/projects/:id/tasks
 * -------------------------------------------------------------------------*/

describe("POST /api/projects/:id/tasks", () => {
    test("creates a task under the project and sets projectId from the path", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app)
            .post(`/api/projects/${a.id}/tasks`)
            .set("Content-Type", "application/json")
            .send({ title: "Write proposal" });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe("Write proposal");
        expect(res.body.projectId).toBe(a.id);
        expect(res.body.completed).toBe(false);
    });

    test("ignores projectId in the body — the path wins", async () => {
        const { a, b } = await seedTwoProjects();
        const res = await request(app)
            .post(`/api/projects/${a.id}/tasks`)
            .set("Content-Type", "application/json")
            .send({ title: "belongs to A", projectId: b.id });

        expect(res.status).toBe(201);
        expect(res.body.projectId).toBe(a.id);
    });

    test("returns 404 when the project does not exist", async () => {
        const res = await request(app)
            .post("/api/projects/000000000000000000000000/tasks")
            .set("Content-Type", "application/json")
            .send({ title: "orphan" });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Project not found");
    });

    test("returns 400 when title is missing", async () => {
        const { a } = await seedTwoProjects();
        const res = await request(app)
            .post(`/api/projects/${a.id}/tasks`)
            .set("Content-Type", "application/json")
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });
});
