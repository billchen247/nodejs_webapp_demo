/* =============================================================================
 * test/server.test.js — integration tests for the Todo REST API (Connect)
 * =============================================================================
 *
 * These tests use ONLY Node.js built-in tools:
 *
 *   * `node:test` — the built-in test runner. Run with `npm test`, which
 *     is aliased to `node --test test/`. There is NO Jest / Mocha / Vitest /
 *     Supertest installed.
 *   * The global `fetch()` — a browser-standard API that is also built into
 *     Node since v18. We use it to make real HTTP requests against the same
 *     server that `src/app.js` exports.
 *
 * Because we hit the server over the network (localhost), these are true
 * integration tests: middleware, routing, controllers, and file persistence
 * are all exercised end-to-end.
 *
 *                +----------+   HTTP    +--------------------+
 *   test cases   |  fetch() | --------> |  src/app.js server |
 *                +----------+   :port   +--------------------+
 *                     ^                          |
 *                     |                          v
 *                     |                  data/todos.json
 *                     +--------- assert ---------+
 *
 * Each test resets `data/todos.json` to a known state so tests do not
 * interfere with each other.
 * ===========================================================================
 * @author Bill Chen
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs/promises");

// Import from the src/ layout. `server` is the http.Server exported by
// src/app.js but NOT yet listening; we start it on a random port below.
// The model helpers let us seed / restore the on-disk fixture.
const { server } = require("../src/app");
const { writeTodos, DATA_FILE } = require("../src/models/todos");

// A stable snapshot of what data/todos.json should look like at the start
// of every test. Using the same fixture everywhere makes tests easy to read.
const SEED_TODOS = [
    {
        id: 1,
        title: "Learn Node.js",
        completed: false,
        createdAt: "2026-09-23T12:00:00.000Z",
    },
    {
        id: 2,
        title: "Understand Connect middleware",
        completed: true,
        createdAt: "2026-09-23T12:05:00.000Z",
    },
];

// Saved so we can restore the file exactly as we found it once tests finish.
let originalFile;

// Filled in once the server has actually bound its (random) port.
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
    // server on port 3001 and allows parallel test runs.
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
    assert.match(body, /<title>Todo Connect API<\/title>/);
    assert.match(body, /\/api\/todos/);
});

test("POST / returns 405 Method Not Allowed with an Allow header", async () => {
    const res = await fetch(`${baseUrl}/`, { method: "POST" });
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get("allow"), "GET");
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
    // The body middleware should catch this and turn it into a clean 400
    // (not let a stack trace escape into a 500).
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
        body: JSON.stringify({ title: "Learn Connect", completed: true }),
    });

    assert.strictEqual(res.status, 200);
    const updated = await res.json();
    assert.strictEqual(updated.id, 1);
    assert.strictEqual(updated.title, "Learn Connect");
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
// Unknown routes
// ---------------------------------------------------------------------------

test("Unknown routes return 404 with a JSON error body", async () => {
    // Falls through the router, hits the notFound middleware at the tail
    // of the Connect chain.
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
    // Sanity-check: the HTML boots swagger-ui-bundle.js against our spec.
    assert.match(body, /swagger-ui-bundle\.js/);
    assert.match(body, /\.\/swagger\.json/);
});

test("GET /api-docs/swagger.json serves the OpenAPI spec", async () => {
    const res = await fetch(`${baseUrl}/api-docs/swagger.json`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const spec = await res.json();
    assert.strictEqual(spec.openapi, "3.0.3");
    assert.strictEqual(spec.info.title, "Todo Connect API");
    // Every controller branch should be described.
    assert.ok(spec.paths["/api/todos"], "spec must document /api/todos");
    assert.ok(spec.paths["/api/todos/{id}"], "spec must document /api/todos/{id}");
});

test("GET /api-docs/ serves the Swagger UI static assets", async () => {
    // Requesting an asset the swagger-ui-dist package ships. If our static
    // middleware is wired up correctly, this returns 200 + JavaScript.
    const res = await fetch(`${baseUrl}/api-docs/swagger-ui-bundle.js`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get("content-type"), /javascript/);
});

// ---------------------------------------------------------------------------
// CORS preflight
// ---------------------------------------------------------------------------

test("OPTIONS preflight returns 204 with CORS headers", async () => {
    const res = await fetch(`${baseUrl}/api/todos`, { method: "OPTIONS" });
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
