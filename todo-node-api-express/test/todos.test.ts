import { describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "./setup.js";

describe("GET /api/todos", () => {
    test("returns all todos with 200 and JSON", async () => {
        const res = await request(app).get("/api/todos");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/application\/json/);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].title).toBe("Learn Node.js");
        expect(res.body[1].completed).toBe(true);
    });

    test("filters completed todos", async () => {
        const res = await request(app).get("/api/todos?completed=true");

        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(2);
    });

    test("filters incomplete todos", async () => {
        const res = await request(app).get("/api/todos?completed=false");

        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(1);
    });

    test("rejects an invalid completed filter", async () => {
        const res = await request(app).get("/api/todos?completed=yolo");

        expect(res.status).toBe(400);
    });
});

describe("GET /api/todos/:id", () => {
    test("returns an existing todo", async () => {
        const res = await request(app).get("/api/todos/1");

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body.title).toBe("Learn Node.js");
    });

    test("returns 404 for a missing todo", async () => {
        const res = await request(app).get("/api/todos/999");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Todo not found");
    });

    test("returns 400 for an invalid id", async () => {
        const res = await request(app).get("/api/todos/abc");

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid Todo ID");
    });
});

describe("POST /api/todos", () => {
    test("creates a todo", async () => {
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

    test("rejects a missing title", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test("rejects invalid JSON", async () => {
        const res = await request(app)
            .post("/api/todos")
            .set("Content-Type", "application/json")
            .send("{ this is not valid JSON");

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid JSON body");
    });
});

describe("PUT /api/todos/:id", () => {
    test("updates todo fields", async () => {
        const res = await request(app)
            .put("/api/todos/1")
            .set("Content-Type", "application/json")
            .send({ title: "Learn Express", completed: true });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body.title).toBe("Learn Express");
        expect(res.body.completed).toBe(true);
    });

    test("returns 404 for a missing todo", async () => {
        const res = await request(app)
            .put("/api/todos/999")
            .set("Content-Type", "application/json")
            .send({ title: "nope" });

        expect(res.status).toBe(404);
    });

    test("rejects a non-boolean completed field", async () => {
        const res = await request(app)
            .put("/api/todos/1")
            .set("Content-Type", "application/json")
            .send({ completed: "yes" });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/completed/i);
    });
});

describe("DELETE /api/todos/:id", () => {
    test("deletes a todo with no response body", async () => {
        const res = await request(app).delete("/api/todos/1");

        expect(res.status).toBe(204);
        expect(res.text).toBe("");
        expect((await request(app).get("/api/todos/1")).status).toBe(404);
    });

    test("returns 404 for a missing todo", async () => {
        const res = await request(app).delete("/api/todos/999");

        expect(res.status).toBe(404);
    });
});