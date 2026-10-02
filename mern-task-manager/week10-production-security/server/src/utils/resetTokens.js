/**
 * @file src/utils/resetTokens.js
 * @author Bill Chen
 * @description Password reset token helper.
 */
// Design:
//   1. The server generates a 32-byte random token and SHA-256 hashes it.
//   2. The HASH is stored in the DB.
//   3. The RAW token goes into the link we email the user.
//   4. When the user submits the link, we hash the raw token again and
//      look up the user with { resetTokenHash, resetTokenExpires: {$gt: now} }.
//
// Why hash? If the database ever leaks, an attacker holding reset
// tokens could seize accounts. Hashing turns reset tokens into
// password-equivalents at rest.

import crypto from "node:crypto";
import { env } from "../config/env.js";

export function generateResetToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  return { raw, hash, expiresAt };
}

export function hashResetToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
