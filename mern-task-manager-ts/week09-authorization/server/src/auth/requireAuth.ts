/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/auth/requireAuth.ts
 *
 * Express middleware that enforces authentication.
 *
 * Pattern: read the auth cookie, verify the JWT, look up the user so we
 * know their role, then attach `req.userId` and `req.userRole` for
 * downstream handlers. If anything goes wrong, respond 401 with a generic
 * message.
 *
 * Week 9 note:
 *   requireAuth now does a database lookup to get the role. The naive
 *   alternative is "put the role in the JWT and trust it", which is
 *   faster (no DB hit) but means a demotion from admin→user takes
 *   effect only when the token expires. For a classroom app that
 *   trade-off is not worth it — the lookup is one indexed query and
 *   authorization decisions are then always based on the current state.
 */
import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_NAME } from "./cookie.js";
import { verifyAuthToken } from "./jwt.js";
import { User, type UserRole } from "../models/User.js";

// Module augmentation: tell TypeScript about the fields we add to the
// Express Request. Both are optional on the base type because public
// routes may not run requireAuth at all.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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
  // One indexed lookup — the User's `_id` is the primary key. If the user
  // was deleted since their session was issued, treat them as logged out.
  const user = await User.findById(payload.sub).select("role");
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.userId = user.id;
  req.userRole = user.role as UserRole;
  next();
}
