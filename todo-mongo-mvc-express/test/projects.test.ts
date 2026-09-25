/* ---------------------------------------------------------------------------
 * test/projects.test.ts
 *
 * Integration tests for the /projects resource and its nested /tasks routes.
 * Uses supertest's `agent()` to persist the session cookie across requests.
 * -------------------------------------------------------------------------*/

import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Express } from "express";
import type TestAgent from "supertest/lib/agent";

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

// Helper: sign up + return a supertest agent whose cookie jar is authenticated.
async function signUpAs(
    email: string,
    password: string,
    name: string
): Promise<TestAgent> {
    const agent = request.agent(app);
    const res = await agent
        .post("/signup")
        .type("form")
        .send({ name, email, password, confirmPassword: password });
    if (res.status !== 302) throw new Error(`signup failed: ${res.status} ${res.text.slice(0, 300)}`);
    return agent;
}

/* --- Project CRUD ------------------------------------------------------ */

describe("GET /projects", () => {
    it("shows the empty state when no projects exist", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const res = await agent.get("/projects");
        expect(res.status).toBe(200);
        expect(res.text).toContain("No projects to show");
    });

    it("lists projects with owner + task count", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        await agent.post("/projects").type("form").send({
            name: "Website Redesign",
            description: "Q4 rebuild",
        });
        const res = await agent.get("/projects");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Website Redesign");
        expect(res.text).toContain("Q4 rebuild");
        expect(res.text).toContain("owner:");
        expect(res.text).toContain("0 tasks");
    });

    it("filters ?scope=mine to only my projects", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        await ada.post("/projects").type("form").send({ name: "Adas project" });

        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        await bob.post("/projects").type("form").send({ name: "Bobs project" });

        const mine = await bob.get("/projects?scope=mine");
        expect(mine.status).toBe(200);
        expect(mine.text).toContain("Bobs project");
        expect(mine.text).not.toContain("Adas project");

        const all = await bob.get("/projects?scope=all");
        expect(all.text).toContain("Adas project");
        expect(all.text).toContain("Bobs project");
    });
});

describe("POST /projects", () => {
    it("creates a project owned by the current user", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const res = await agent.post("/projects").type("form").send({
            name: "New Project",
            description: "The description",
        });
        expect(res.status).toBe(302);
        expect(res.headers.location).toMatch(/^\/projects\/[a-f0-9]{24}$/);

        const project = await ProjectModel.findOne({ name: "New Project" });
        const user = await UserModel.findByEmail("ada@example.com");
        expect(project).not.toBeNull();
        expect(String(project?.owner)).toBe(String(user?._id));
    });

    it("re-renders with an error when the name is empty", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const res = await agent.post("/projects").type("form").send({ name: "" });
        expect(res.status).toBe(400);
        expect(res.text).toContain("Project name cannot be empty");
    });

    it("rejects a duplicate (owner, name) pair", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        await agent.post("/projects").type("form").send({ name: "Same Name" });
        const res = await agent.post("/projects").type("form").send({ name: "Same Name" });
        expect(res.status).toBe(400);
        expect(res.text).toContain("already have a project");
    });
});

describe("GET /projects/:id", () => {
    it("shows the project page with an empty board", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const create = await agent.post("/projects").type("form").send({ name: "Alpha" });
        const url = create.headers.location;
        const res = await agent.get(url);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Alpha");
        expect(res.text).toContain("To do");
        expect(res.text).toContain("In progress");
        expect(res.text).toContain("Done");
        expect(res.text).toContain("+ New task");
    });

    it("hides mutating actions from non-owners", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const create = await ada.post("/projects").type("form").send({ name: "Alpha" });
        const url = create.headers.location;

        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        const res = await bob.get(url);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Alpha");
        expect(res.text).not.toContain("+ New task");
        expect(res.text).toContain("Only the owner can add");
    });

    it("returns 400 on a malformed id", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const res = await agent.get("/projects/not-an-object-id");
        expect(res.status).toBe(400);
    });
});

describe("PUT /projects/:id (via method-override)", () => {
    it("lets the owner rename and describe", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const create = await agent.post("/projects").type("form").send({ name: "Old" });
        const id = create.headers.location.split("/").pop();

        const res = await agent
            .post(`/projects/${id}?_method=PUT`)
            .type("form")
            .send({ name: "New Name", description: "Updated" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/projects/${id}`);

        const p = await ProjectModel.findById(id);
        expect(p?.name).toBe("New Name");
        expect(p?.description).toBe("Updated");
    });

    it("returns 403 when a non-owner tries to edit", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const create = await ada.post("/projects").type("form").send({ name: "Adas" });
        const id = create.headers.location.split("/").pop();

        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        const res = await bob
            .post(`/projects/${id}?_method=PUT`)
            .type("form")
            .send({ name: "Bob renamed it" });
        expect(res.status).toBe(403);
    });
});

describe("DELETE /projects/:id", () => {
    it("owner can delete, and tasks cascade", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const create = await agent.post("/projects").type("form").send({ name: "Alpha" });
        const id = create.headers.location.split("/").pop();

        // add two tasks
        await agent.post(`/projects/${id}/tasks`).type("form").send({ title: "T1" });
        await agent.post(`/projects/${id}/tasks`).type("form").send({ title: "T2" });
        expect(await TaskModel.countDocuments({ project: id })).toBe(2);

        const res = await agent.post(`/projects/${id}?_method=DELETE`);
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/projects");

        expect(await ProjectModel.findById(id)).toBeNull();
        expect(await TaskModel.countDocuments({ project: id })).toBe(0);
    });

    it("non-owner gets 403", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const create = await ada.post("/projects").type("form").send({ name: "Alpha" });
        const id = create.headers.location.split("/").pop();

        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        const res = await bob.post(`/projects/${id}?_method=DELETE`);
        expect(res.status).toBe(403);
    });
});
