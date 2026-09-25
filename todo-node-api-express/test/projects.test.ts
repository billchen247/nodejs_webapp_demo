import { describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "./setup.js";

describe("GET /api/projects", () => {
    test("lists projects", async () => {
        const response = await request(app).get("/api/projects");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].name).toBe("Express Learning API");
    });
});

describe("POST, PUT, and DELETE /api/projects", () => {
    test("creates, updates, and deletes a project", async () => {
        const created = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .send({ name: "Portfolio API", description: "Showcase project" });

        expect(created.status).toBe(201);
        expect(created.body.name).toBe("Portfolio API");

        const updated = await request(app)
            .put(`/api/projects/${created.body.id}`)
            .set("Content-Type", "application/json")
            .send({ description: "Updated description" });

        expect(updated.status).toBe(200);
        expect(updated.body.description).toBe("Updated description");

        const deleted = await request(app).delete(`/api/projects/${created.body.id}`);
        expect(deleted.status).toBe(204);
    });
});

describe("Project validation", () => {
    test("rejects a missing name and invalid id", async () => {
        const invalidBody = await request(app)
            .post("/api/projects")
            .set("Content-Type", "application/json")
            .send({ description: "Missing name" });
        const invalidId = await request(app).get("/api/projects/nope");

        expect(invalidBody.status).toBe(400);
        expect(invalidId.status).toBe(400);
    });
});