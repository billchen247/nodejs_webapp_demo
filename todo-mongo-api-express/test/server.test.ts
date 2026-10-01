/* =============================================================================
 * test/server.test.ts — integration tests for the Todo Mongo Express API
 * =============================================================================
 *
 * Tools:
 *   * Vitest              — test runner (Jest-compatible API, ESM+TS native).
 *   * supertest           — HTTP assertion library; speaks to an Express
 *                           `Application` without binding a real port.
 *   * mongodb-memory-server — spins up an ephemeral in-process MongoDB. No
 *                             external `mongod` needed to run the suite.
 *
 * Layout:
 *
 *      +------------+  request()   +--------------+   Mongoose   +---------------+
 *      | supertest  | -----------> | Express app  | -----------> | mongodb-memory |
 *      +------------+              +--------------+              +---------------+
 *            ^                                                            |
 *            +------------- expect() <------- response --------------------+
 *
 * beforeAll starts the memory server and connects Mongoose to it.
 * beforeEach clears the `todos` and `tasks` collections so tests don't leak state.
 * afterAll disconnects Mongoose and shuts the memory server down.
 * ===========================================================================
 * @author Bill Chen
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectToDatabase, disconnectFromDatabase } from "../src/db.js";
import { TodoModel } from "../src/models/todos.js";
import { TaskModel } from "../src/models/tasks.js";

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
    await TodoModel.deleteMany({});
    await TaskModel.deleteMany({});
});

async function seedTwo() {
    const a = await TodoModel.create({ title: "Learn Node.js", completed: false });
    const b = await TodoModel.create({ title: "Understand Mongoose", completed: true });
    return { a, b };
}

/* ---------------------------------------------------------------------------
 * Home page
 * -------------------------------------------------------------------------*/

describe("home page", () => {
    test("GET / serves the HTML home page", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
        expect(res.text).toMatch(/<title>Todo Mongo Express API<\/title>/);
        expect(res.text).toMatch(/\/api\/todos/);
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/todos
 * -------------------------------------------------------------------------*/

describe("GET /api/todos", () => {
    test("returns all todos with 200 and JSON", async () => {
        await seedTwo();
        const res = await request(app).get("/api/todos");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].title).toBe("Learn Node.js");
        expect(res.body[1].completed).toBe(true);
        // The toJSON transform swapped _id for a string id and dropped __v.
        expect(typeof res.body[0].id).toBe("string");
        expect(res.body[0]._id).toBeUndefined();
        expect(res.body[0].__v).toBeUndefined();
    });

    test("returns an empty array when the collection is empty", async () => {
        const res = await request(app).get("/api/todos");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test("?completed=true filters completed todos", async () => {
        await seedTwo();
        const res = await request(app).get("/api/todos?completed=true");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe("Understand Mongoose");
    });

    test("?completed=false filters incomplete todos", async () => {
        await seedTwo();
        const res = await request(app).get("/api/todos?completed=false");
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe("Learn Node.js");
    });

    test("?completed=yolo is a 400 (Zod rejects the enum)", async () => {
        const res = await request(app).get("/api/todos?completed=yolo");
        expect(res.status).toBe(400);
    });

    test("?limit / ?skip paginate the result set", async () => {
        for (let i = 0; i < 5; i++) {
            await TodoModel.create({ title: `t${i}`, completed: false });
        }
        const res = await request(app).get("/api/todos?limit=2&skip=1");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].title).toBe("t1");
        expect(res.body[1].title).toBe("t2");
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/todos/:id
 * -------------------------------------------------------------------------*/

describe("GET /api/todos/:id", () => {
    test("returns the specific todo when it exists", async () => {
        const { a } = await seedTwo();
        const res = await request(app).get(`/api/todos/${a.id}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(a.id);
        expect(res.body.title).toBe("Learn Node.js");
    });

    test("returns 404 for a well-formed but unknown id", async () => {
        // A syntactically-valid ObjectId that isn't in the DB.
        const res = await request(app).get("/api/todos/000000000000000000000000");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Todo not found");
    });

    test("returns 400 when the id is not a 24-char hex string", async () => {
        const res = await request(app).get("/api/todos/not-an-oid");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid Todo ID");
    });
});

/* ---------------------------------------------------------------------------
 * POST /api/todos
 * -------------------------------------------------------------------------*/

describe("POST /api/todos", () => {
    test("creates a new todo and returns 201 with the created record", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({ title: "Write tests" });

        expect(res.status).toBe(201);
        expect(typeof res.body.id).toBe("string");
        expect(res.body.title).toBe("Write tests");
        expect(res.body.completed).toBe(false);
        expect(res.body.createdAt).toBeTruthy();
        expect(res.body.updatedAt).toBeTruthy();

        const list = await request(app).get("/api/todos");
        expect(list.body).toHaveLength(1);
    });

    test("returns 400 when title is missing", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test("returns 400 when title is an empty/whitespace-only string", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({ title: "   " });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test("returns 400 when the request body is invalid JSON", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send("{ this is not valid JSON");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid JSON body");
    });
});

/* ---------------------------------------------------------------------------
 * PUT /api/todos/:id
 * -------------------------------------------------------------------------*/

describe("PUT /api/todos/:id", () => {
    test("updates fields and returns the updated todo", async () => {
        const { a } = await seedTwo();
        const res = await request(app)
            .put(`/api/todos/${a.id}`)
            .set("Content-Type", "application/json")
            .send({ title: "Learn Express", completed: true });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(a.id);
        expect(res.body.title).toBe("Learn Express");
        expect(res.body.completed).toBe(true);
    });

    test("returns 404 when the todo does not exist", async () => {
        const res = await request(app)
            .put("/api/todos/000000000000000000000000")
            .set("Content-Type", "application/json")
            .send({ title: "nope" });
        expect(res.status).toBe(404);
    });

    test("returns 400 for a non-boolean 'completed' field", async () => {
        const { a } = await seedTwo();
        const res = await request(app)
            .put(`/api/todos/${a.id}`)
            .set("Content-Type", "application/json")
            .send({ completed: "yes" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/completed/i);
    });

    test("ignores unknown fields", async () => {
        const { a } = await seedTwo();
        const res = await request(app)
            .put(`/api/todos/${a.id}`)
            .set("Content-Type", "application/json")
            .send({ title: "keep", extra: "ignored", id: "hacked" });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe("keep");
        expect(res.body.id).toBe(a.id); // untouched
    });
});

/* ---------------------------------------------------------------------------
 * DELETE /api/todos/:id
 * -------------------------------------------------------------------------*/

describe("DELETE /api/todos/:id", () => {
    test("removes the todo and returns 204 with no body", async () => {
        const { a } = await seedTwo();
        const res = await request(app).delete(`/api/todos/${a.id}`);
        expect(res.status).toBe(204);
        expect(res.text).toBe("");

        const followUp = await request(app).get(`/api/todos/${a.id}`);
        expect(followUp.status).toBe(404);
    });

    test("returns 404 when the todo does not exist", async () => {
        const res = await request(app).delete("/api/todos/000000000000000000000000");
        expect(res.status).toBe(404);
    });
});

/* ---------------------------------------------------------------------------
 * First-class /api/tasks resource
 * -------------------------------------------------------------------------*/

describe("/api/tasks", () => {
    test("creates and retrieves project task fields with sensible defaults", async () => {
        const created = await request(app)
            .post("/api/tasks")
            .send({
                title: "Plan project task",
                description: "Break down the first release.",
                status: "in_progress",
                priority: "high",
                dueDate: "2026-10-15T17:00:00.000Z",
                labels: ["planning", "release"],
            });
        expect(created.status).toBe(201);
        expect(created.body.title).toBe("Plan project task");
        expect(created.body.description).toBe("Break down the first release.");
        expect(created.body.status).toBe("in_progress");
        expect(created.body.priority).toBe("high");
        expect(created.body.completed).toBe(false);
        expect(created.body.dueDate).toBe("2026-10-15T17:00:00.000Z");
        expect(created.body.labels).toEqual(["planning", "release"]);

        const listed = await request(app).get("/api/tasks?status=in_progress&priority=high");
        expect(listed.status).toBe(200);
        expect(listed.body.map((task: { id: string }) => task.id)).toContain(
            created.body.id
        );

        const fetched = await request(app).get(`/api/tasks/${created.body.id}`);
        expect(fetched.status).toBe(200);
        expect(fetched.body.id).toBe(created.body.id);

        const updated = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ status: "done" });
        expect(updated.status).toBe(200);
        expect(updated.body.status).toBe("done");
        expect(updated.body.completed).toBe(true);

        const listedAsTodo = await request(app).get("/api/todos");
        expect(listedAsTodo.body).toEqual([]);

        const removed = await request(app).delete(`/api/tasks/${created.body.id}`);
        expect(removed.status).toBe(204);
        expect((await request(app).get(`/api/tasks/${created.body.id}`)).status).toBe(404);
    });

    test("keeps the legacy completed field synchronized with task status", async () => {
        const created = await request(app).post("/api/tasks").send({ title: "Compatibility" });
        const completed = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ completed: true });
        expect(completed.body.status).toBe("done");
        expect(completed.body.completed).toBe(true);

        const reopened = await request(app)
            .put(`/api/tasks/${created.body.id}`)
            .send({ status: "in_review" });
        expect(reopened.body.status).toBe("in_review");
        expect(reopened.body.completed).toBe(false);
    });

    test("rejects unsupported task statuses and priorities", async () => {
        const badStatus = await request(app)
            .post("/api/tasks")
            .send({ title: "Invalid status", status: "blocked" });
        expect(badStatus.status).toBe(400);

        const badPriority = await request(app)
            .post("/api/tasks")
            .send({ title: "Invalid priority", priority: "immediate" });
        expect(badPriority.status).toBe(400);
    });
});

/* ---------------------------------------------------------------------------
 * Unknown routes
 * -------------------------------------------------------------------------*/

describe("unknown routes", () => {
    test("return 404 with a JSON error body", async () => {
        const res = await request(app).get("/api/nope");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Route not found");
    });
});

/* ---------------------------------------------------------------------------
 * Swagger UI / OpenAPI spec
 * -------------------------------------------------------------------------*/

describe("swagger", () => {
    test("GET /api-docs/ serves the Swagger UI HTML", async () => {
        const res = await request(app).get("/api-docs/");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
        expect(res.text).toMatch(/swagger-ui/);
    });

    test("GET /api-docs/swagger.json serves the OpenAPI spec", async () => {
        const res = await request(app).get("/api-docs/swagger.json");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body.openapi).toBe("3.0.3");
        expect(res.body.info.title).toBe("Todo Mongo Express API");
        expect(res.body.paths["/api/todos"]).toBeTruthy();
        expect(res.body.paths["/api/todos/{id}"]).toBeTruthy();
        expect(res.body.paths["/api/tasks"]).toBeTruthy();
        expect(res.body.paths["/api/tasks/{id}"]).toBeTruthy();
    });
});

/* ---------------------------------------------------------------------------
 * CORS preflight
 * -------------------------------------------------------------------------*/

describe("CORS", () => {
    test("OPTIONS preflight returns 204 with CORS headers", async () => {
        const res = await request(app)
            .options("/api/todos")
            .set("Origin", "http://localhost:5173")
            .set("Access-Control-Request-Method", "POST");
        expect(res.status).toBe(204);
        expect(res.headers["access-control-allow-origin"]).toBe(
            "http://localhost:5173"
        );
        expect(res.headers["access-control-allow-methods"]).toMatch(/POST/);
    });
});
