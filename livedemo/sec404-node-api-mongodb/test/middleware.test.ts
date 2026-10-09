import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { errorHandler, notFound } from "../src/middlewares.js";
import { HttpError } from "../src/utils/http-error.js";

describe("middleware error handling", () => {
  it("creates a 404 error with the original URL", () => {
    const req = { originalUrl: "/missing-resource" } as any;
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
    } as any;
    const next = vi.fn();

    notFound(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe("🔍 - Not Found - /missing-resource");
  });

  it("uses the current response status for errors", () => {
    const req = { originalUrl: "/oops" } as any;
    const res = {
      statusCode: 418,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
      },
    } as any;
    const next = vi.fn();

    errorHandler(new Error("teapot"), req, res, next);

    expect(res.statusCode).toBe(418);
    expect(res.payload).toMatchObject({
      message: "teapot",
    });
    expect(res.payload.stack).toContain("teapot");
  });

  it("falls back to a 500 status when no prior status exists", () => {
    const req = { originalUrl: "/broken" } as any;
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
      },
    } as any;
    const next = vi.fn();

    errorHandler(new Error("boom"), req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.payload).toMatchObject({
      message: "boom",
    });
    expect(res.payload.stack).toContain("boom");
  });

  it("returns a 400 status with validation messages for Zod errors", () => {
    const req = { originalUrl: "/api/todos" } as any;
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
      },
    } as any;
    const error = new ZodError([
      {
        code: "custom",
        message: "title is required",
        path: ["title"],
      },
    ]);

    errorHandler(error, req, res, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.payload).toMatchObject({
      message: "title is required",
    });
  });

  it("preserves a client-error status attached by request parsing", () => {
    const req = { originalUrl: "/api/todos" } as any;
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
      },
    } as any;
    const error = Object.assign(new SyntaxError("Invalid JSON"), { status: 400 });

    errorHandler(error, req, res, vi.fn());

    expect(res.statusCode).toBe(400);
  });

  it("uses the status carried by an HttpError", () => {
    const req = { originalUrl: "/api/todos/missing" } as any;
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.payload = payload;
      },
    } as any;

    errorHandler(new HttpError(404, "Todo not found"), req, res, vi.fn());

    expect(res.statusCode).toBe(404);
  });
});
