/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: server/src/auth/requireAuth.ts
 *
 * Express middleware that enforces authentication.
 *
 * Pattern: read the auth cookie, verify the JWT, attach `req.userId`, and
 * call `next()`. If anything goes wrong, respond 401 with a generic
 * message. Downstream controllers can rely on `req.userId` being a
 * non-empty string — the type is tightened via module augmentation so
 * they do not have to reach into `req as any`.
 */
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME } from "./cookie.js";
import { verifyAuthToken } from "./jwt.js";

// Module augmentation: add `userId` to Express's Request so TypeScript
// knows about it downstream of this middleware. We never set it in
// public routes, so it is optional on the base type.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = (req.cookies ?? {})[AUTH_COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.userId = payload.sub;
  next();
}
