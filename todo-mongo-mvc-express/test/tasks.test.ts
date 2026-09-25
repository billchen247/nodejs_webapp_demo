/* ---------------------------------------------------------------------------
 * test/tasks.test.ts
 *
 * Integration tests for /projects/:projectId/tasks.
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

async function signUpAs(email: string, password: string, name: string): Promise<TestAgent> {
    const agent = request.agent(app);
    const res = await agent
        .post("/signup")
        .type("form")
        .send({ name, email, password, confirmPassword: password });
    if (res.status !== 302) throw new Error(`signup failed: ${res.status}`);
    return agent;
}

async function createProjectAs(agent: TestAgent, name: string): Promise<string> {
    const res = await agent.post("/projects").type("form").send({ name });
    if (res.status !== 302) throw new Error(`project create failed: ${res.status}`);
    return res.headers.location.split("/").pop() as string;
}

/* --- Creation --------------------------------------------------------- */

describe("POST /projects/:pid/tasks", () => {
    it("owner can create a task with defaults", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(agent, "Alpha");

        const res = await agent
            .post(`/projects/${pid}/tasks`)
            .type("form")
            .send({ title: "Write tests" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe(`/projects/${pid}`);

        const task = await TaskModel.findOne({ title: "Write tests" });
        expect(task).not.toBeNull();
        expect(task?.status).toBe("todo");
        expect(task?.priority).toBe("medium");
        expect(task?.dueDate).toBeNull();
        expect(task?.assignee).toBeNull();
    });

    it("owner can set status / priority / due date / assignee", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        const pid = await createProjectAs(ada, "Alpha");

        const bobUser = await UserModel.findByEmail("bob@example.com");
        expect(bobUser).not.toBeNull();

        const res = await ada
            .post(`/projects/${pid}/tasks`)
            .type("form")
            .send({
                title: "Ship v1",
                description: "wrap up MVP",
                status: "in_progress",
                priority: "high",
                dueDate: "2030-01-15",
                assignee: String(bobUser?._id),
            });
        expect(res.status).toBe(302);

        const task = await TaskModel.findOne({ title: "Ship v1" });
        expect(task?.status).toBe("in_progress");
        expect(task?.priority).toBe("high");
        expect(task?.dueDate?.toISOString().slice(0, 10)).toBe("2030-01-15");
        expect(String(task?.assignee)).toBe(String(bobUser?._id));
        // avoid unused-var warning when bob agent isn't needed later
        expect(bob).toBeDefined();
    });

    it("re-renders the form on empty title", async () => {
        const agent = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(agent, "Alpha");

        const res = await agent
            .post(`/projects/${pid}/tasks`)
            .type("form")
            .send({ title: "" });
        expect(res.status).toBe(400);
        expect(res.text).toContain("Title cannot be empty");
    });

    it("non-owner is forbidden from creating tasks", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Alpha");

        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        const res = await bob
            .post(`/projects/${pid}/tasks`)
            .type("form")
            .send({ title: "sneaky task" });
        expect(res.status).toBe(403);
    });
});

/* --- Show ------------------------------------------------------------- */

describe("GET /projects/:pid/tasks/:id", () => {
    it("renders a task detail page with the assignee shown", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        expect(bob).toBeDefined();
        const pid = await createProjectAs(ada, "Alpha");

        const bobUser = await UserModel.findByEmail("bob@example.com");
        await ada
            .post(`/projects/${pid}/tasks`)
            .type("form")
            .send({ title: "Reticulate splines", assignee: String(bobUser?._id) });

        const task = await TaskModel.findOne({ title: "Reticulate splines" });
        const res = await ada.get(`/projects/${pid}/tasks/${task?._id}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Reticulate splines");
        expect(res.text).toContain("Bob");
    });
});

/* --- Update & status change ------------------------------------------ */

describe("PUT /projects/:pid/tasks/:id", () => {
    it("owner can edit every field", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Alpha");
        await ada.post(`/projects/${pid}/tasks`).type("form").send({ title: "Old" });
        const task = await TaskModel.findOne({ title: "Old" });

        const res = await ada
            .post(`/projects/${pid}/tasks/${task?._id}?_method=PUT`)
            .type("form")
            .send({
                title: "New",
                description: "changed",
                status: "done",
                priority: "low",
                dueDate: "2031-06-30",
                assignee: "",
            });
        expect(res.status).toBe(302);

        const updated = await TaskModel.findById(task?._id);
        expect(updated?.title).toBe("New");
        expect(updated?.status).toBe("done");
        expect(updated?.priority).toBe("low");
        expect(updated?.assignee).toBeNull();
        expect(updated?.dueDate?.toISOString().slice(0, 10)).toBe("2031-06-30");
    });

    it("non-owner cannot edit", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Alpha");
        await ada.post(`/projects/${pid}/tasks`).type("form").send({ title: "T1" });
        const task = await TaskModel.findOne({ title: "T1" });

        const bob = await signUpAs("bob@example.com", "password1", "Bob");
        const res = await bob
            .post(`/projects/${pid}/tasks/${task?._id}?_method=PUT`)
            .type("form")
            .send({ title: "hijacked", status: "done", priority: "high" });
        expect(res.status).toBe(403);
    });
});

describe("POST /projects/:pid/tasks/:id/status", () => {
    it("moves the task between board columns", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Alpha");
        await ada.post(`/projects/${pid}/tasks`).type("form").send({ title: "Move me" });
        const task = await TaskModel.findOne({ title: "Move me" });

        const res = await ada
            .post(`/projects/${pid}/tasks/${task?._id}/status`)
            .type("form")
            .send({ status: "done" });
        expect(res.status).toBe(302);

        const t = await TaskModel.findById(task?._id);
        expect(t?.status).toBe("done");
    });

    it("rejects an unknown status", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Alpha");
        await ada.post(`/projects/${pid}/tasks`).type("form").send({ title: "T" });
        const task = await TaskModel.findOne({ title: "T" });

        const res = await ada
            .post(`/projects/${pid}/tasks/${task?._id}/status`)
            .type("form")
            .send({ status: "not-a-status" });
        expect(res.status).toBe(400);
    });
});

/* --- Delete ---------------------------------------------------------- */

describe("DELETE /projects/:pid/tasks/:id", () => {
    it("owner can delete a task", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Alpha");
        await ada.post(`/projects/${pid}/tasks`).type("form").send({ title: "Doomed" });
        const task = await TaskModel.findOne({ title: "Doomed" });

        const res = await ada.post(`/projects/${pid}/tasks/${task?._id}?_method=DELETE`);
        expect(res.status).toBe(302);
        expect(await TaskModel.findById(task?._id)).toBeNull();
    });
});

/* --- Board rendering ------------------------------------------------- */

describe("board on /projects/:id", () => {
    it("groups tasks by status column", async () => {
        const ada = await signUpAs("ada@example.com", "password1", "Ada");
        const pid = await createProjectAs(ada, "Board");

        // Reach directly into Mongoose so we don't churn HTTP for three tasks.
        const project = await ProjectModel.findById(pid);
        const owner = await UserModel.findByEmail("ada@example.com");
        await TaskModel.create([
            { title: "AAA", status: "todo",        priority: "high",   project: project?._id, createdBy: owner?._id },
            { title: "BBB", status: "in_progress", priority: "medium", project: project?._id, createdBy: owner?._id },
            { title: "CCC", status: "done",        priority: "low",    project: project?._id, createdBy: owner?._id },
        ]);

        const res = await ada.get(`/projects/${pid}`);
        expect(res.status).toBe(200);
        // Each column heading shows the correct count.
        expect(res.text).toMatch(/To do\s*<span class="col-count">\(1\)/);
        expect(res.text).toMatch(/In progress\s*<span class="col-count">\(1\)/);
        expect(res.text).toMatch(/Done\s*<span class="col-count">\(1\)/);
        expect(res.text).toContain("AAA");
        expect(res.text).toContain("BBB");
        expect(res.text).toContain("CCC");
    });
});
