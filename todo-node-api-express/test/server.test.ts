/* =============================================================================
 * test/server.test.ts — integration tests for the Todo Express API
 * =============================================================================
 *
 * Tools:
 *   * Vitest      — test runner (Jest-compatible API, ESM+TS native).
 *   * supertest   — an HTTP assertion library that speaks directly to an
 *                   Express `Application` without needing to bind a real
 *                   port. Faster and more portable than opening a socket.
 *
 * Layout:
 *
 *                +-----------+     .request()     +----------------------+
 *   tests -----> | supertest | -----------------> | createApp() (Express)|
 *                +-----------+                    +----------------------+
 *                     ^                                    |
 *                     |                                    v
 *                     |                            data/todos.json
 *                     +-------- expect() ------------------+
 *
 * `beforeEach` resets the on-disk fixture so tests don't leak state into
 * each other. `beforeAll` / `afterAll` snapshot and restore the file so
 * running the suite doesn't clobber the developer's checked-in seed data.
 * ===========================================================================
 * @author Bill Chen
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import request from "supertest";
import { createApp } from "../src/app.js";
import { DATA_FILE, writeTodos, type Todo } from "../src/models/todos.js";
import {
    DATA_FILE as STUDENTS_DATA_FILE,
    writeStudents,
    type Student,
} from "../src/models/students.js";

const SEED_TODOS: Todo[] = [
    {
        id: 1,
        title: "Learn Node.js",
        completed: false,
        createdAt: "2026-09-23T12:00:00.000Z",
    },
    {
        id: 2,
        title: "Understand Express 5 routing",
        completed: true,
        createdAt: "2026-09-23T12:05:00.000Z",
    },
];

const SEED_STUDENTS: Student[] = [
    {
        id: 1,
        name: "Tom Wu",
        registrationActive: false,
        createdAt: "2026-09-24T12:00:00.000Z",
    },
    {
        id: 2,
        name: "Ada Lovelace",
        registrationActive: true,
        createdAt: "2026-09-24T12:05:00.000Z",
    },
];

let originalFile: string | null;
let originalStudentsFile: string | null;
const app = createApp();

beforeAll(async () => {
    try {
        originalFile = await readFile(DATA_FILE, "utf8");
    } catch {
        originalFile = null;
    }
    try {
        originalStudentsFile = await readFile(STUDENTS_DATA_FILE, "utf8");
    } catch {
        originalStudentsFile = null;
    }
});

afterAll(async () => {
    if (originalFile !== null) {
        await writeFile(DATA_FILE, originalFile, "utf8");
    }
    if (originalStudentsFile !== null) {
        await writeFile(STUDENTS_DATA_FILE, originalStudentsFile, "utf8");
    }
});

beforeEach(async () => {
    await writeTodos(SEED_TODOS);
    await writeStudents(SEED_STUDENTS);
});

/* ---------------------------------------------------------------------------
 * Home page
 * -------------------------------------------------------------------------*/

describe("home page", () => {
    test("GET / serves the HTML home page", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
        expect(res.text).toMatch(/<title>Todo Express API<\/title>/);
        expect(res.text).toMatch(/\/api\/todos/);
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/todos
 * -------------------------------------------------------------------------*/

describe("GET /api/todos", () => {
    test("returns all todos with 200 and JSON", async () => {
        const res = await request(app).get("/api/todos");
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].title).toBe("Learn Node.js");
        expect(res.body[1].completed).toBe(true);
    });

    test("?completed=true filters completed todos", async () => {
        const res = await request(app).get("/api/todos?completed=true");
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(2);
    });

    test("?completed=false filters incomplete todos", async () => {
        const res = await request(app).get("/api/todos?completed=false");
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(1);
    });

    test("?completed=yolo is a 400 (Zod rejects the enum)", async () => {
        const res = await request(app).get("/api/todos?completed=yolo");
        expect(res.status).toBe(400);
    });
});

/* ---------------------------------------------------------------------------
 * GET /api/todos/:id
 * -------------------------------------------------------------------------*/

describe("GET /api/todos/:id", () => {
    test("returns the specific todo when it exists", async () => {
        const res = await request(app).get("/api/todos/1");
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body.title).toBe("Learn Node.js");
    });

    test("returns 404 when the id does not exist", async () => {
        const res = await request(app).get("/api/todos/999");
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Todo not found");
    });

    test("returns 400 when the id is not a positive integer", async () => {
        const res = await request(app).get("/api/todos/abc");
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
        expect(typeof res.body.id).toBe("number");
        expect(res.body.title).toBe("Write tests");
        expect(res.body.completed).toBe(false);
        expect(res.body.createdAt).toBeTruthy();

        const list = await request(app).get("/api/todos");
        expect(list.body).toHaveLength(3);
    });

    test("returns 400 when title is missing", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test("returns 400 when the request body is invalid JSON", async () => {
        // express.json()'s parser throws SyntaxError; the errorHandler in
        // src/middleware/errors.ts turns that into a clean 400.
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
        const res = await request(app)
            .put("/api/todos/1")
            .set("Content-Type", "application/json")
            .send({ title: "Learn Express", completed: true });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body.title).toBe("Learn Express");
        expect(res.body.completed).toBe(true);
    });

    test("returns 404 when the todo does not exist", async () => {
        const res = await request(app)
            .put("/api/todos/999")
            .set("Content-Type", "application/json")
            .send({ title: "nope" });
        expect(res.status).toBe(404);
    });

    test("returns 400 for a non-boolean 'completed' field", async () => {
        const res = await request(app)
            .put("/api/todos/1")
            .set("Content-Type", "application/json")
            .send({ completed: "yes" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/completed/i);
    });
});

/* ---------------------------------------------------------------------------
 * DELETE /api/todos/:id
 * -------------------------------------------------------------------------*/

describe("DELETE /api/todos/:id", () => {
    test("removes the todo and returns 204 with no body", async () => {
        const res = await request(app).delete("/api/todos/1");
        expect(res.status).toBe(204);
        expect(res.text).toBe("");

        const followUp = await request(app).get("/api/todos/1");
        expect(followUp.status).toBe(404);
    });

    test("returns 404 when the todo does not exist", async () => {
        const res = await request(app).delete("/api/todos/999");
        expect(res.status).toBe(404);
    });
});

/* ---------------------------------------------------------------------------
 * Student REST resource
 * -------------------------------------------------------------------------*/

describe("/api/students", () => {
    test("lists students and supports registrationActive filtering", async () => {
        const all = await request(app).get("/api/students");
        expect(all.status).toBe(200);
        expect(all.body).toHaveLength(2);

        const active = await request(app).get("/api/students?registrationActive=true");
        expect(active.status).toBe(200);
        expect(active.body).toHaveLength(1);
        expect(active.body[0].name).toBe("Ada Lovelace");
    });

    test("creates, updates, and deletes a student", async () => {
        const created = await request(app)
            .post("/api/students")
            .set("Content-Type", "application/json")
            .send({ name: "Grace Hopper" });

        expect(created.status).toBe(201);
        expect(created.body.name).toBe("Grace Hopper");
        expect(created.body.registrationActive).toBe(false);

        const updated = await request(app)
            .put(`/api/students/${created.body.id}`)
            .set("Content-Type", "application/json")
            .send({ registrationActive: true });
        expect(updated.status).toBe(200);
        expect(updated.body.registrationActive).toBe(true);

        const deleted = await request(app).delete(`/api/students/${created.body.id}`);
        expect(deleted.status).toBe(204);
    });

    test("validates student input and ids", async () => {
        const invalidBody = await request(app)
            .post("/api/students")
            .set("Content-Type", "application/json")
            .send({ name: "" });
        expect(invalidBody.status).toBe(400);

        const invalidId = await request(app).get("/api/students/nope");
        expect(invalidId.status).toBe(400);
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
 * Method Not Allowed — Express's router matches URL first, so a verb we
 * didn't define on a known URL falls through to the notFound handler.
 * (Real 405 semantics require an .all() catch-all per route; we keep the
 * default behaviour to match the sister project's tests as closely as
 * possible.)
 * -------------------------------------------------------------------------*/

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
        expect(res.body.info.title).toBe("Todo Express API");
        expect(res.body.paths["/api/todos"]).toBeTruthy();
        expect(res.body.paths["/api/todos/{id}"]).toBeTruthy();
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
