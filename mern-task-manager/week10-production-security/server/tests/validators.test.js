/**
 * @file tests/validators.test.js
 * @author Bill Chen
 * @description Unit tests for the express-validator schemas in
 *   src/validators/. Each schema is mounted on a tiny throwaway express
 *   route (body/param parsing plus `runValidators`) so we can assert on
 *   plain HTTP status codes instead of reaching into express-validator's
 *   internals.
 */
import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { runValidators } from "../src/middleware/validate.js";
import {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} from "../src/validators/authValidators.js";
import {
  createTaskValidators,
  updateTaskValidators,
  idOnlyValidators,
} from "../src/validators/taskValidators.js";

function appWithBodyValidators(validators) {
  const app = express();
  app.use(express.json());
  app.post("/probe", validators, runValidators, (req, res) =>
    res.status(200).json({ ok: true }),
  );
  return app;
}

function appWithParamValidators(validators) {
  const app = express();
  app.use(express.json());
  app.put("/probe/:id", validators, runValidators, (req, res) =>
    res.status(200).json({ ok: true }),
  );
  app.get("/probe/:id", validators, runValidators, (req, res) =>
    res.status(200).json({ ok: true }),
  );
  return app;
}

describe("registerValidators", () => {
  const app = appWithBodyValidators(registerValidators);
  const valid = { name: "Ada", email: "ada@example.com", password: "longenough1" };

  it("accepts a well-formed registration body", async () => {
    const res = await request(app).post("/probe").send(valid);
    expect(res.status).toBe(200);
  });

  it("rejects a missing name", async () => {
    const res = await request(app).post("/probe").send({ ...valid, name: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app).post("/probe").send({ ...valid, email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app).post("/probe").send({ ...valid, password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("loginValidators", () => {
  const app = appWithBodyValidators(loginValidators);

  it("accepts a well-formed login body", async () => {
    const res = await request(app)
      .post("/probe")
      .send({ email: "ada@example.com", password: "x" });
    expect(res.status).toBe(200);
  });

  it("rejects a missing password", async () => {
    const res = await request(app)
      .post("/probe")
      .send({ email: "ada@example.com", password: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/probe")
      .send({ email: "nope", password: "x" });
    expect(res.status).toBe(400);
  });
});

describe("forgotPasswordValidators", () => {
  const app = appWithBodyValidators(forgotPasswordValidators);

  it("accepts a valid email", async () => {
    const res = await request(app).post("/probe").send({ email: "ada@example.com" });
    expect(res.status).toBe(200);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app).post("/probe").send({ email: "nope" });
    expect(res.status).toBe(400);
  });
});

describe("resetPasswordValidators", () => {
  const app = appWithBodyValidators(resetPasswordValidators);
  const token = "a".repeat(64);

  it("accepts a well-formed reset body", async () => {
    const res = await request(app)
      .post("/probe")
      .send({ token, password: "longenough1" });
    expect(res.status).toBe(200);
  });

  it("rejects a token that's too short", async () => {
    const res = await request(app)
      .post("/probe")
      .send({ token: "short", password: "longenough1" });
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app).post("/probe").send({ token, password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("createTaskValidators", () => {
  const app = appWithBodyValidators(createTaskValidators);

  it("accepts a title-only body", async () => {
    const res = await request(app).post("/probe").send({ title: "write tests" });
    expect(res.status).toBe(200);
  });

  it("rejects a missing title", async () => {
    const res = await request(app).post("/probe").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a title over 200 characters", async () => {
    const res = await request(app).post("/probe").send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });

  it("rejects a non-boolean completed", async () => {
    const res = await request(app)
      .post("/probe")
      .send({ title: "x", completed: "yes" });
    expect(res.status).toBe(400);
  });
});

describe("updateTaskValidators", () => {
  const app = appWithParamValidators(updateTaskValidators);
  const validId = "507f1f77bcf86cd799439011";

  it("accepts a partial, well-formed update", async () => {
    const res = await request(app).put(`/probe/${validId}`).send({ completed: true });
    expect(res.status).toBe(200);
  });

  it("rejects a malformed id", async () => {
    const res = await request(app).put("/probe/not-an-id").send({ completed: true });
    expect(res.status).toBe(400);
  });

  it("rejects an empty title when provided", async () => {
    const res = await request(app).put(`/probe/${validId}`).send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe("idOnlyValidators", () => {
  const app = appWithParamValidators(idOnlyValidators);
  const validId = "507f1f77bcf86cd799439011";

  it("accepts a well-formed ObjectId", async () => {
    const res = await request(app).get(`/probe/${validId}`);
    expect(res.status).toBe(200);
  });

  it("rejects a malformed id", async () => {
    const res = await request(app).get("/probe/not-an-id");
    expect(res.status).toBe(400);
  });
});
