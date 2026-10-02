/**
 * @file src/controllers/userController.js
 * @author Bill Chen
 * @description Admin-only user management endpoints.
 *   Routes are protected by `authenticate` + `requireRole("admin")`.
 */

import mongoose from "mongoose";
import { User } from "../models/User.js";

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.status(200).json(users.map((u) => u.toSafeJSON()));
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}
