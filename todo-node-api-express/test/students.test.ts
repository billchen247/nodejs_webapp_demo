import { describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "./setup.js";

describe("GET /api/students", () => {
    test("lists students and filters by registration status", async () => {
        const all = await request(app).get("/api/students");
        const active = await request(app).get("/api/students?registrationActive=true");

        expect(all.status).toBe(200);
        expect(all.body).toHaveLength(2);
        expect(active.status).toBe(200);
        expect(active.body).toHaveLength(1);
        expect(active.body[0].name).toBe("Ada Lovelace");
    });
});

describe("POST, PUT, and DELETE /api/students", () => {
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
});

describe("Student validation", () => {
    test("rejects an empty name and invalid id", async () => {
        const invalidBody = await request(app)
            .post("/api/students")
            .set("Content-Type", "application/json")
            .send({ name: "" });
        const invalidId = await request(app).get("/api/students/nope");

        expect(invalidBody.status).toBe(400);
        expect(invalidId.status).toBe(400);
    });
});