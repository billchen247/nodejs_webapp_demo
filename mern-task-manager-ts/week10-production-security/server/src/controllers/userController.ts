/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/controllers/userController.ts
 *
 * Admin-only user management endpoints.
 *
 * In Week 10, body validation lives in the router (`validateBody` +
 * `updateRoleSchema`), so this controller is simpler than its Week 9
 * sibling: it no longer re-checks that `role` is a known string.
 *
 * Access to each handler is gated by `requireAuth + requireRole("admin")`
 * at the route layer — handlers can therefore assume the caller is an
 * authenticated admin.
 */
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import type { UpdateRoleBody } from "../schemas/taskSchemas.js";

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
 * The one guard-rail that is NOT in the schema: we refuse to let an
 * admin demote themselves. A single misclick would otherwise lock the
 * app out of admin access. (In a bigger app this is usually "cannot be
 * the last admin"; the simpler rule is enough here.)
 */
export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseObjectId(req, res);
    if (id === null) return;

    const { role: nextRole } = req.body as UpdateRoleBody;

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
