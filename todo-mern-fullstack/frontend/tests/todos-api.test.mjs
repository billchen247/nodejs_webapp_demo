import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { todosApi } from "../src/api/todos.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

test("list requests todos with the session cookie", async () => {
    const todos = [{ id: "todo-1", title: "Study", completed: false }];
    let requestedUrl;
    let requestInit;

    globalThis.fetch = async (url, init) => {
        requestedUrl = url;
        requestInit = init;
        return new Response(JSON.stringify(todos), {
            headers: { "Content-Type": "application/json" },
        });
    };

    assert.deepEqual(await todosApi.list(), todos);
    assert.equal(requestedUrl, "/api/todos");
    assert.equal(requestInit.credentials, "include");
    assert.equal(requestInit.headers["Content-Type"], "application/json");
});

test("create sends a JSON POST and returns the created todo", async () => {
    const todo = { id: "todo-2", title: "Read", completed: false };
    let requestInit;

    globalThis.fetch = async (_url, init) => {
        requestInit = init;
        return new Response(JSON.stringify(todo), {
            headers: { "Content-Type": "application/json" },
        });
    };

    assert.deepEqual(await todosApi.create({ title: "Read" }), todo);
    assert.equal(requestInit.method, "POST");
    assert.equal(requestInit.body, JSON.stringify({ title: "Read" }));
});

test("remove handles a 204 response without a body", async () => {
    globalThis.fetch = async () => new Response(null, { status: 204 });

    assert.equal(await todosApi.remove("todo-1"), undefined);
});

test("API errors expose the server error message", async () => {
    globalThis.fetch = async () => new Response(
        JSON.stringify({ error: "Todo not found" }),
        {
            status: 404,
            headers: { "Content-Type": "application/json" },
        },
    );

    await assert.rejects(todosApi.get("missing"), {
        message: "Todo not found",
    });
});
