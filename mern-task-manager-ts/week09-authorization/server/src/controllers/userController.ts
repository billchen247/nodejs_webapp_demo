/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/controllers/userController.ts
 *
 * Admin-only user management endpoints.
 *
 * Access to each handler is gated by `requireAuth + requireRole("admin")`
 * at the route layer. The handlers themselves can therefore assume the
 * caller is an authenticated admin — they do not need to re-check.
 *
 * We deliberately keep this surface small:
 *   - GET /api/users         → list all users
 *   - GET /api/users/:id     → read one user
 *   - PATCH /api/users/:id   → change a user's role
 *
 * Promotion and demotion live behind PATCH, not a bespoke endpoint, so
 * students see one place where "admin changes something about a user".
 */
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { User, USER_ROLES, type UserRole } from "../models/User.js";

function parseObjectId(req: Request, res: Response): string | null {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid user id", id });
    return null;
  }
  return id;
}

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Newest users first. For a real admin console you would add
    // pagination; the teaching project happily lists everyone.
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json(users.map((u) => u.toJSON()));
  } catch (err) {
    next(err);
  }
}

export async function readUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseObjectId(req, res);
    if (id === null) return;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: "User not found", id });
      return;
    }
    res.status(200).json(user.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id — change a user's role.
 *
 * Two guard-rails worth noticing:
 *   1. We validate the new role against our enum, instead of trusting
 *      whatever string the client sent. A stray `role: "superuser"`
 *      must not sail through to the database.
 *   2. We refuse to let an admin demote themselves — a single mistake
 *      would lock the app out of admin access. In a real app this
 *      is usually enforced in a dedicated "cannot be the last admin"
 *      check; the simpler "no self-demotion" is enough here.
 */
export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseObjectId(req, res);
    if (id === null) return;

    const body = (req.body ?? {}) as { role?: unknown };
    const nextRole = body.role;
    if (typeof nextRole !== "string" || !USER_ROLES.includes(nextRole as UserRole)) {
      res.status(400).json({
        error: `Role must be one of: ${USER_ROLES.join(", ")}`,
      });
      return;
    }

    if (req.userId === id && nextRole !== "admin") {
      res.status(400).json({ error: "Admins cannot demote themselves" });
      return;
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { role: nextRole },
      { new: true, runValidators: true },
    );
    if (!updated) {
      res.status(404).json({ error: "User not found", id });
      return;
    }
    res.status(200).json(updated.toJSON());
  } catch (err) {
    next(err);
  }
}
