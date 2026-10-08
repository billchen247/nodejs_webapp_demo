import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app.js";

describe("app", () => {
  it("responds with a not found message", () =>
    request(app)
      .get("/what-is-this-even")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));
});

describe("GET /", () => {
  it("serves a learning homepage with project and API guidance", () =>
    request(app)
      .get("/")
      .expect("Content-Type", /html/)
      .expect(200)
      .expect((res) => {
        for (const content of [
          "Build your first REST API.",
          "Node.js + TypeScript",
          "Express routes",
          "MongoDB connection",
          "/api/v1/emojis",
          "/api-docs",
          "not yet stored in the database",
        ]) {
          if (!res.text.includes(content)) {
            throw new Error(`Homepage is missing expected learning content: ${content}`);
          }
        }
      }));
});

describe("Swagger UI", () => {
  it("serves the documentation interface", () =>
    request(app)
      .get("/api-docs")
      .expect("Content-Type", /html/)
      .expect("Content-Security-Policy", /nonce-/)
      .expect(200)
      .expect((res) => {
        if (!res.text.includes("swagger-ui-dist@5.17.14/swagger-ui-bundle.js")) {
          throw new Error("Swagger UI bundle was not included in the documentation page");
        }
        if (!res.text.includes("/api-docs/openapi.json")) {
          throw new Error("OpenAPI document URL was not configured");
        }
      }));

  it("serves the OpenAPI document for the existing routes", () =>
    request(app)
      .get("/api-docs/openapi.json")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect((res) => {
        const document = res.body as { openapi: string; paths: Record<string, unknown> };
        expect(document.openapi).toBe("3.0.3");
        expect(Object.keys(document.paths)).toEqual([
          "/api/v1",
          "/api/v1/emojis",
        ]);
      }));
});
