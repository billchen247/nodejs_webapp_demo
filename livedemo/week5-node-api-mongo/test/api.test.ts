import request from "supertest";
import { describe, it } from "vitest";

import app from "../src/app.js";
import Project from "../src/models/project.js";

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
  it("has a unique MongoDB index for project names", () => {
    const hasUniqueNameIndex = Project.schema.indexes().some(([fields, options]) =>
      fields.name === 1 && options.unique === true);

    if (!hasUniqueNameIndex) {
      throw new Error("Expected a unique MongoDB index on project name");
    }
  });

  it("rejects an empty project name query", () =>
    request(app)
      .get("/api/v1/projects?name=%20%20")
      .expect(400)
      .expect(({ body }) => {
        if (body.message !== "Invalid project query") {
          throw new Error("Invalid project query response message");
        }
      }));

  it("rejects unsupported project query parameters", () =>
    request(app)
      .get("/api/v1/projects?unknown=value")
      .expect(400)
      .expect(({ body }) => {
        if (body.message !== "Invalid project query") {
          throw new Error("Invalid project query response message");
        }
      }));

  it("rejects repeated project name query parameters", () =>
    request(app)
      .get("/api/v1/projects?name=First&name=Second")
      .expect(400)
      .expect(({ body }) => {
        if (body.message !== "Invalid project query") {
          throw new Error("Invalid project query response message");
        }
      }));

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

  it("rejects a project name that contains no letters", () =>
    request(app)
      .post("/api/v1/projects")
      .send({ name: "12345" })
      .expect(400)
      .expect(({ body }) => {
        const issue = body.issues?.find(
          (item: { message?: string }) => item.message === "Project name must contain at least one letter",
        );
        if (!issue) {
          throw new Error("Expected the custom project-name validation issue");
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
