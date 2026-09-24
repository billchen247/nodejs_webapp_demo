/* =============================================================================
 * test/server.test.js — integration tests for the Todo REST API (Express)
 * =============================================================================
 *
 * These tests use ONLY Node.js built-in tools:
 *
 *   * `node:test` — the built-in test runner. Run with `npm test`, which
 *     is aliased to `node --test test/`. There is NO Jest / Mocha / Vitest /
 *     Supertest installed — deliberately, so the test setup mirrors
 *     ../todo-connect-api's.
 *   * The global `fetch()` — a browser-standard API also built into Node
 *     since v18. We make real HTTP requests against the same server that
 *     `src/app.js` exports.
 *
 * Because we hit the server over the network (localhost), these are true
 * integration tests: middleware, routing, controllers, and file persistence
 * are all exercised end-to-end.
 * ===========================================================================
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs/promises");

const { server } = require("../src/app");
const { writeTodos, DATA_FILE } = require("../src/models/todos");

const SEED_TODOS = [
    {
        id: 1,
        title: "Learn Node.js",
        completed: false,
        createdAt: "2026-09-23T12:00:00.000Z",
    },
    {
        id: 2,
        title: "Understand Express routing",
        completed: true,
        createdAt: "2026-09-23T12:05:00.000Z",
    },
];

let originalFile;
let baseUrl;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

test.before(async () => {
    try {
        originalFile = await fs.readFile(DATA_FILE, "utf8");
    } catch {
        originalFile = null;
    }

    // Port 0 asks the OS for any free port. Avoids collisions with a real
    // server on port 3002 and allows parallel test runs.
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (originalFile !== null) {
        await fs.writeFile(DATA_FILE, originalFile, "utf8");
    }
});

test.beforeEach(async () => {
    await writeTodos(SEED_TODOS);
});

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

test("GET / serves the HTML home page", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    const body = await res.text();
    assert.match(body, /<title>Todo Express API<\/title>/);
    assert.match(body, /\/api\/todos/);
});

test("POST / returns 404 (Express only registered GET on /)", async () => {
    // ../todo-connect-api's hand-written router returns 405 here because we
    // wrote that check by hand. Express's default is to skip the POST route
    // when only .get() was registered, and the request falls through to the
    // notFound middleware. Both are valid REST behavior; we assert on
    // whichever the framework does.
    const res = await fetch(`${baseUrl}/`, { method: "POST" });
    assert.strictEqual(res.status, 404);
});

// ---------------------------------------------------------------------------
// GET /api/todos — return the full list
// ---------------------------------------------------------------------------

test("GET /api/todos returns all todos with 200 and JSON body", async () => {
    const res = await fetch(`${baseUrl}/api/todos`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);

    const body = await res.json();
    assert.strictEqual(body.length, 2);
    assert.strictEqual(body[0].title, "Learn Node.js");
    assert.strictEqual(body[1].completed, true);
});

test("GET /api/todos?completed=true filters completed todos", async () => {
    const res = await fetch(`${baseUrl}/api/todos?completed=true`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.length, 1);
    assert.strictEqual(body[0].id, 2);
});

test("GET /api/todos?completed=false filters incomplete todos", async () => {
    const res = await fetch(`${baseUrl}/api/todos?completed=false`);
    const body = await res.json();
    assert.strictEqual(body.length, 1);
    assert.strictEqual(body[0].id, 1);
});

// ---------------------------------------------------------------------------
// GET /api/todos/:id — return one todo
// ---------------------------------------------------------------------------

test("GET /api/todos/:id returns the specific todo when it exists", async () => {
    const res = await fetch(`${baseUrl}/api/todos/1`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.id, 1);
    assert.strictEqual(body.title, "Learn Node.js");
});

test("GET /api/todos/:id returns 404 when the id does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/todos/999`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.error, "Todo not found");
});

test("GET /api/todos/:id returns 400 when the id is not a positive integer", async () => {
    const res = await fetch(`${baseUrl}/api/todos/abc`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, "Invalid Todo ID");
});

// ---------------------------------------------------------------------------
// POST /api/todos — create a new todo
// ---------------------------------------------------------------------------

test("POST /api/todos creates a new todo and returns 201 with the created record", async () => {
    const res = await fetch(`${baseUrl}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Write tests" }),
    });

    assert.strictEqual(res.status, 201);
    const created = await res.json();

    assert.strictEqual(typeof created.id, "number");
    assert.strictEqual(created.title, "Write tests");
    assert.strictEqual(created.completed, false);
    assert.ok(created.createdAt, "createdAt should be present");

    const listRes = await fetch(`${baseUrl}/api/todos`);
    const list = await listRes.json();
    assert.strictEqual(list.length, 3);
});

test("POST /api/todos returns 400 when title is missing", async () => {
    const res = await fetch(`${baseUrl}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /title/i);
});

test("POST /api/todos returns 400 when the request body is invalid JSON", async () => {
    // express.json() throws a SyntaxError with `type === "entity.parse.failed"`,
    // which our error handler maps to a clean 400.
    const res = await fetch(`${baseUrl}/api/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ this is not valid JSON",
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error, "Invalid JSON body");
});

// ---------------------------------------------------------------------------
// PUT /api/todos/:id — update an existing todo
// ---------------------------------------------------------------------------

test("PUT /api/todos/:id updates fields and returns the updated todo", async () => {
    const res = await fetch(`${baseUrl}/api/todos/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Learn Express", completed: true }),
    });

    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.id, 1);
    assert.strictEqual(updated.title, "Learn Express");
    assert.strictEqual(updated.completed, true);
});

test("PUT /api/todos/:id returns 404 when the todo does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/todos/999`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "nope" }),
    });
    assert.strictEqual(res.status, 404);
});

// ---------------------------------------------------------------------------
// DELETE /api/todos/:id — delete a todo
// ---------------------------------------------------------------------------

test("DELETE /api/todos/:id removes the todo and returns 204 with no body", async () => {
    const res = await fetch(`${baseUrl}/api/todos/1`, { method: "DELETE" });
    assert.strictEqual(res.status, 204);
    const text = await res.text();
    assert.strictEqual(text, "");

    const followUp = await fetch(`${baseUrl}/api/todos/1`);
    assert.strictEqual(followUp.status, 404);
});

test("DELETE /api/todos/:id returns 404 when the todo does not exist", async () => {
    const res = await fetch(`${baseUrl}/api/todos/999`, { method: "DELETE" });
    assert.strictEqual(res.status, 404);
});

// ---------------------------------------------------------------------------
// Method Not Allowed on /api/todos*
// ---------------------------------------------------------------------------

test("PATCH /api/todos returns 405 with an Allow header", async () => {
    const res = await fetch(`${baseUrl}/api/todos`, { method: "PATCH" });
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get("allow"), "GET, POST");
});

test("PATCH /api/todos/:id returns 405 with an Allow header", async () => {
    const res = await fetch(`${baseUrl}/api/todos/1`, { method: "PATCH" });
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get("allow"), "GET, PUT, DELETE");
});

// ---------------------------------------------------------------------------
// Unknown routes
// ---------------------------------------------------------------------------

test("Unknown routes return 404 with a JSON error body", async () => {
    const res = await fetch(`${baseUrl}/api/nope`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.error, "Route not found");
});

// ---------------------------------------------------------------------------
// Swagger UI / OpenAPI spec
// ---------------------------------------------------------------------------

test("GET /api-docs/ serves the Swagger UI shell", async () => {
    const res = await fetch(`${baseUrl}/api-docs/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    const body = await res.text();
    // swagger-ui-express serves its own HTML shell that boots swagger-ui.
    assert.match(body, /swagger-ui/i);
});

test("GET /api-docs/swagger.json serves the OpenAPI spec", async () => {
    const res = await fetch(`${baseUrl}/api-docs/swagger.json`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const spec = await res.json();
    assert.strictEqual(spec.openapi, "3.0.3");
    assert.strictEqual(spec.info.title, "Todo Express API");
    assert.ok(spec.paths["/api/todos"], "spec must document /api/todos");
    assert.ok(spec.paths["/api/todos/{id}"], "spec must document /api/todos/{id}");
});

// ---------------------------------------------------------------------------
// CORS preflight
// ---------------------------------------------------------------------------

test("OPTIONS preflight returns CORS headers", async () => {
    // The `cors` package answers OPTIONS with 204 by default.
    const res = await fetch(`${baseUrl}/api/todos`, {
        method: "OPTIONS",
        headers: {
            Origin: "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    });
    assert.strictEqual(res.status, 204);
    assert.strictEqual(
        res.headers.get("access-control-allow-origin"),
        "http://localhost:5173"
    );
    assert.match(
        res.headers.get("access-control-allow-methods"),
        /POST/
    );
});
