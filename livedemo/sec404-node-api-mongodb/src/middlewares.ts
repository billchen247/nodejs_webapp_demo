import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import type ErrorResponse from "./interfaces/error-response.js";

import { env } from "./env.js";
import { HttpError } from "./utils/http-error.js";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err: Error, req: Request, res: Response<ErrorResponse>, _next: NextFunction) {
  let errorStatus: number | undefined;
  if (err instanceof HttpError) {
    errorStatus = err.status;
  } else if (err instanceof ZodError) {
    errorStatus = 400;
  } else if (
    "status" in err
    && typeof err.status === "number"
    && err.status >= 400
    && err.status < 600
  ) {
    errorStatus = err.status;
  }

  const statusCode = errorStatus ?? (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode);
  res.json({
    message: err instanceof ZodError
      ? err.issues.map((issue) => issue.message).join(", ")
      : err.message,
    stack: env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}
