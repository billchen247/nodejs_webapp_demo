import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { request } from "../src/api/common.ts";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const storage = new Map();

globalThis.window = {
    localStorage: {
        getItem(key) {
            return storage.get(key) ?? null;
        },
        setItem(key, value) {
            storage.set(key, value);
        },
        removeItem(key) {
            storage.delete(key);
        },
    },
};

afterEach(() => {
    globalThis.fetch = originalFetch;
    storage.clear();
});

test("request sends the stored token and stores the response token", async () => {
    storage.set("todo-mern-fullstack:auth-token", "stored-token");
    let requestInit;

    globalThis.fetch = async (_url, init) => {
        requestInit = init;
        return new Response(JSON.stringify({ ok: true }), {
            headers: {
                "Content-Type": "application/json",
                "X-Auth-Token": "new-response-token",
            },
        });
    };

    assert.deepEqual(await request("/api/profile"), { ok: true });
    assert.equal(requestInit.credentials, "include");
    assert.equal(requestInit.headers.get("X-Auth-Token"), "stored-token");
    assert.equal(storage.get("todo-mern-fullstack:auth-token"), "new-response-token");
});

test("request preserves cookie authentication when no local token is stored", async () => {
    let requestInit;

    globalThis.fetch = async (_url, init) => {
        requestInit = init;
        return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json" },
        });
    };

    await request("/api/profile");
    assert.equal(requestInit.credentials, "include");
    assert.equal(requestInit.headers.has("X-Auth-Token"), false);
});

afterEach(() => {
    globalThis.window = originalWindow;
});
