/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/middleware/validate.ts
 *
 * Request validation with zod.
 *
 * Why validate at the edge?
 *   Controllers are much simpler to reason about when they only have to
 *   handle well-shaped input. Validation at the edge is also where you
 *   enforce rules like "password must be 8+ chars" one time, rather
 *   than in every controller that creates or updates a user.
 *
 * Why zod?
 *   zod schemas double as TypeScript types (`z.infer<typeof schema>`),
 *   so there is a single source of truth for "what does the body of
 *   this endpoint look like?".
 *
 * The middleware replaces `req.body` with the parsed (and therefore
 * typed) version. Controllers no longer need to re-check types.
 */
import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
      return;
    }
    // Replace the body with the parsed value — now it's typed and
    // every extraneous field has been stripped.
    req.body = result.data as unknown as Record<string, unknown>;
    next();
  };
}

function formatZodError(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] = issue.message;
  }
  return out;
}
