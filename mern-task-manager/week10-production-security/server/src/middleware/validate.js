/**
 * @file src/middleware/validate.js
 * @author Bill Chen
 * @description Validation middleware helper. Pair with express-validator chains.
 */
// Why validate at the edge?
//   - Mongoose will catch some invalid data, but by then we may have
//     done work (hashing, DB round-trips).
//   - A good error message at the boundary teaches API consumers.
//   - It centralizes rules so we aren't repeating `if (!x) 400` logic
//     in every controller.

import { validationResult } from "express-validator";

export function runValidators(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return res.status(400).json({ error: "Validation failed", errors });
}
