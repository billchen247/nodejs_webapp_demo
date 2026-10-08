import request from "supertest";
import { describe, it } from "vitest";

import app from "../src/app.js";

describe("GET /api/v1", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, {
        message: "hello world API in sec403 live demo - 👋🌎🌍🌏",
      }));
});

describe("GET /api/v1/emojis", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/api/v1/emojis")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, ["😀", "😳", "🙄"]));
});

describe("Project API validation", () => {
  it("rejects a project without a name", () =>
    request(app)
      .post("/api/v1/projects")
      .send({ description: "Practice REST APIs" })
      .expect(400)
      .expect(({ body }) => {
        if (body.message !== "Invalid project") {
          throw new Error("Invalid project response message");
        }
      }));

  it("rejects malformed project IDs before querying MongoDB", () =>
    request(app)
      .get("/api/v1/projects/not-an-object-id")
      .expect(400, { message: "Invalid project id" }));

  it("rejects empty project patches", () =>
    request(app)
      .patch("/api/v1/projects/507f1f77bcf86cd799439011")
      .send({})
      .expect(400)
      .expect(({ body }) => {
        if (body.message !== "Invalid project") {
          throw new Error("Invalid project response message");
        }
      }));
});
