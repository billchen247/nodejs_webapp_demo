/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/auth/requireRole.ts
 *
 * `requireRole("admin")` — authorization middleware.
 *
 * Authentication (`requireAuth`) answers "who are you?".
 * Authorization (`requireRole`) answers "what are you allowed to do?".
 *
 * Always chain the two: `router.use(requireAuth, requireRole("admin"))`.
 * If `requireAuth` has not run, `req.userRole` is undefined and this
 * middleware will respond 401 — a conservative default.
 *
 * Status codes:
 *   - 401 when the caller is not authenticated.
 *   - 403 when the caller is authenticated but the role is wrong.
 *   The two are different in a very real sense: 401 means "please
 *   log in", 403 means "logging in won't help, you don't have access".
 *
 * We take an array so the middleware is reusable for "any of these
 * roles": `requireRole("admin", "owner")`. For now we only use "admin".
 */
import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../models/User.js";

export function requireRole(...allowed: UserRole[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction): void {
    const role = req.userRole;
    if (!role) {
      // No role on the request means requireAuth did not run (or failed).
      // Fail closed with 401 rather than leaking that admin routes exist.
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!allowed.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
