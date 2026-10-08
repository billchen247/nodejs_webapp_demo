import mongoose from "mongoose";
import request from "supertest";
import type { Test } from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import app from "../src/app.js";
import Project from "../src/models/project.js";
import Todo from "../src/models/todo.js";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("filters project names by a case-insensitive substring", async () => {
    const sort = vi.fn().mockResolvedValue([]);
    vi.spyOn(Project, "find").mockReturnValue({ sort } as never);

    await request(app)
      .get("/api/v1/projects?name=web%20api")
      .expect(200, []);

    expect(Project.find).toHaveBeenCalledWith({ name: /web api/i });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("treats project name query text literally when searching", async () => {
    const sort = vi.fn().mockResolvedValue([]);
    vi.spyOn(Project, "find").mockReturnValue({ sort } as never);

    await request(app)
      .get("/api/v1/projects?name=Build%20%28API%29")
      .expect(200, []);

    expect(Project.find).toHaveBeenCalledWith({ name: /Build \(API\)/i });
  });

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

describe("Todo project validation", () => {
  const missingProjectId = "507f191e810c19729de860ea";

  async function expectMissingProjectRejected(testRequest: Test): Promise<void> {
    vi.spyOn(Project, "exists").mockResolvedValue(null);

    const response = await testRequest
      .send({ title: "Todo", projectId: missingProjectId })
      .expect(400);

    expect(response.body).toMatchObject({
      message: "Invalid todo",
      issues: [{ path: ["projectId"], message: "Project does not exist" }],
    });
  }

  it("rejects a nonexistent project when creating a todo", () =>
    expectMissingProjectRejected(request(app).post("/api/v1/todos")));

  it("rejects a nonexistent project when replacing a todo", () =>
    expectMissingProjectRejected(request(app).put("/api/v1/todos/507f1f77bcf86cd799439011")));

  it("rejects a nonexistent project when patching a todo", () =>
    expectMissingProjectRejected(request(app).patch("/api/v1/todos/507f1f77bcf86cd799439011")));

  it("rejects malformed project IDs before checking project existence", () =>
    request(app)
      .post("/api/v1/todos")
      .send({ title: "Todo", projectId: "not-an-object-id" })
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe("Invalid todo");
        expect(body.issues).toEqual(expect.arrayContaining([
          expect.objectContaining({ path: ["projectId"], message: "Invalid project id" }),
        ]));
      }));
});

describe("Todo title uniqueness and list queries", () => {
  it("has a unique MongoDB index for todo titles", () => {
    const hasUniqueTitleIndex = Todo.schema.indexes().some(([fields, options]) =>
      fields.title === 1 && options.unique === true);

    expect(hasUniqueTitleIndex).toBe(true);
  });

  it("rejects a duplicate title when creating a todo", async () => {
    vi.spyOn(Todo, "exists").mockResolvedValue({ _id: "507f191e810c19729de860eb" } as never);

    await request(app)
      .post("/api/v1/todos")
      .send({ title: "Duplicate title" })
      .expect(409, { message: "Todo title already exists" });

    expect(Todo.exists).toHaveBeenCalledWith({ title: "Duplicate title" });
  });

  it("returns a conflict if another request creates the same title concurrently", async () => {
    vi.spyOn(Todo, "exists").mockResolvedValue(null);
    vi.spyOn(Todo, "create").mockRejectedValue({
      code: 11000,
      keyPattern: { title: 1 },
    });

    await request(app)
      .post("/api/v1/todos")
      .send({ title: "Concurrent title" })
      .expect(409, { message: "Todo title already exists" });
  });

  it("rejects a duplicate title when updating a todo", async () => {
    vi.spyOn(Todo, "exists").mockResolvedValue({ _id: "507f191e810c19729de860eb" } as never);

    await request(app)
      .patch("/api/v1/todos/507f191e810c19729de860ea")
      .send({ title: "Duplicate title" })
      .expect(409, { message: "Todo title already exists" });

    expect(Todo.exists).toHaveBeenCalledWith({
      title: "Duplicate title",
      _id: { $ne: expect.any(mongoose.Types.ObjectId) },
    });
  });

  it("filters todos by title, completion, and project", async () => {
    const sort = vi.fn().mockResolvedValue([]);
    vi.spyOn(Todo, "find").mockReturnValue({ sort } as never);

    await request(app)
      .get("/api/v1/todos?title=Write%20docs&completed=false&projectId=507f191e810c19729de860ea")
      .expect(200, []);

    expect(Todo.find).toHaveBeenCalledWith({
      title: /Write docs/i,
      completed: false,
      projectId: expect.any(mongoose.Types.ObjectId),
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("treats title query text literally when searching", async () => {
    const sort = vi.fn().mockResolvedValue([]);
    vi.spyOn(Todo, "find").mockReturnValue({ sort } as never);

    await request(app)
      .get("/api/v1/todos?title=Build%20%28API%29")
      .expect(200, []);

    expect(Todo.find).toHaveBeenCalledWith({ title: /Build \(API\)/i });
  });

  it("rejects invalid todo list query parameters", () =>
    request(app)
      .get("/api/v1/todos?completed=maybe")
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toBe("Invalid todo query");
      }));
});
