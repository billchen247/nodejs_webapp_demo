/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/auth/requireAuth.ts
 *
 * Reads the ACCESS cookie (not the refresh), verifies the JWT,
 * fetches the current role, and attaches `req.userId` + `req.userRole`.
 *
 * The refresh cookie is deliberately NOT consulted here. If an access
 * token has expired, requireAuth responds 401 and the client can call
 * /api/auth/refresh to mint a new one. Mixing the two inside a single
 * middleware would blur the "which token am I presenting?" boundary
 * that keeps the refresh token scoped to a single endpoint.
 */
import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE_NAME } from "./cookie.js";
import { verifyAuthToken } from "./jwt.js";
import { User, type UserRole } from "../models/User.js";

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
  const token = (req.cookies ?? {})[ACCESS_COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const payload = verifyAuthToken(token, "access");
  if (!payload) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = await User.findById(payload.sub).select("role");
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.userId = user.id;
  req.userRole = user.role as UserRole;
  next();
}
