import request from "supertest";
import { describe, it } from "vitest";

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
  it("responds with a json message", () =>
    request(app)
      .get("/")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, {
        message: "this is sec404 live demo. 🦄🌈✨👋🌎🌍🌏✨🌈🦄",
        documentation: "/api-docs",
      }));
});

describe("Swagger UI", () => {
  it("serves the API documentation UI", () =>
    request(app)
      .get("/api-docs")
      .expect("Content-Type", /html/)
      .expect("Content-Security-Policy", /https:\/\/unpkg\.com/)
      .expect(200)
      .expect(/swagger-ui-dist@5\/swagger-ui-bundle\.js/));

  it("serves the OpenAPI specification", () =>
    request(app)
      .get("/api-docs/openapi.json")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect(({ body }) => {
        if (body.openapi !== "3.0.3" || !body.paths["/todos/{id}"]?.put) {
          throw new Error("OpenAPI specification is missing the todo update operation");
        }
      }));
});
