import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { projectsApi } from "../src/api/projects.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

test("list requests projects with the session cookie", async () => {
    const projects = [{ id: "project-1", name: "Website", description: "" }];
    let requestedUrl;
    let requestInit;

    globalThis.fetch = async (url, init) => {
        requestedUrl = url;
        requestInit = init;
        return new Response(JSON.stringify(projects), {
            headers: { "Content-Type": "application/json" },
        });
    };

    assert.deepEqual(await projectsApi.list(), projects);
    assert.equal(requestedUrl, "/api/projects");
    assert.equal(requestInit.credentials, "include");
    assert.equal(new Headers(requestInit.headers).get("Content-Type"), "application/json");
});

test("create sends a JSON POST and returns the created project", async () => {
    const project = { id: "project-2", name: "Portfolio", description: "Personal site" };
    let requestInit;

    globalThis.fetch = async (_url, init) => {
        requestInit = init;
        return new Response(JSON.stringify(project), {
            headers: { "Content-Type": "application/json" },
        });
    };

    const input = { name: "Portfolio", description: "Personal site" };
    assert.deepEqual(await projectsApi.create(input), project);
    assert.equal(requestInit.method, "POST");
    assert.equal(requestInit.body, JSON.stringify(input));
});

test("update sends a JSON PATCH", async () => {
    const project = { id: "project-1", name: "Website v2", description: "" };
    let requestedUrl;
    let requestInit;

    globalThis.fetch = async (url, init) => {
        requestedUrl = url;
        requestInit = init;
        return new Response(JSON.stringify(project), {
            headers: { "Content-Type": "application/json" },
        });
    };

    assert.deepEqual(await projectsApi.update("project-1", { name: "Website v2" }), project);
    assert.equal(requestedUrl, "/api/projects/project-1");
    assert.equal(requestInit.method, "PATCH");
    assert.equal(requestInit.body, JSON.stringify({ name: "Website v2" }));
});

test("remove handles a 204 response without a body", async () => {
    globalThis.fetch = async () => new Response(null, { status: 204 });

    assert.equal(await projectsApi.remove("project-1"), undefined);
});

test("API errors expose the server error message", async () => {
    globalThis.fetch = async () => new Response(
        JSON.stringify({ error: "Project not found" }),
        {
            status: 404,
            headers: { "Content-Type": "application/json" },
        },
    );

    await assert.rejects(projectsApi.get("missing"), { message: "Project not found" });
});
