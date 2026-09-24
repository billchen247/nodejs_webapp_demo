import { describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "./setup.js";

describe("unknown routes", () => {
    test("return a JSON 404 error", async () => {
        const res = await request(app).get("/api/nope");

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Route not found");
    });
});

describe("Swagger documentation", () => {
    test("serves the Swagger UI", async () => {
        const res = await request(app).get("/api-docs/");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
        expect(res.text).toMatch(/swagger-ui/);
    });

    test("includes Todo and Student paths in the OpenAPI document", async () => {
        const res = await request(app).get("/api-docs/swagger.json");

        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe("3.0.3");
        expect(res.body.info.title).toBe("Todo Express API");
        expect(res.body.paths["/api/todos"]).toBeTruthy();
        expect(res.body.paths["/api/todos/{id}"]).toBeTruthy();
        expect(res.body.paths["/api/students"]).toBeTruthy();
        expect(res.body.paths["/api/students/{id}"]).toBeTruthy();
    });
});

describe("CORS", () => {
    test("OPTIONS preflight returns CORS headers", async () => {
        const res = await request(app)
            .options("/api/todos")
            .set("Origin", "http://localhost:5173")
            .set("Access-Control-Request-Method", "POST");

        expect(res.status).toBe(204);
        expect(res.headers["access-control-allow-origin"]).toBe(
            "http://localhost:5173"
        );
        expect(res.headers["access-control-allow-methods"]).toMatch(/POST/);
    });
});