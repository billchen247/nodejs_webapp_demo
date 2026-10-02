/**
 * @file src/config/auth.js
 * @author Bill Chen
 * @description Centralized auth configuration + helpers.
 *   Keeping JWT and cookie options in one file means we won't drift later.
 */

import jwt from "jsonwebtoken";
import { env } from "./env.js";

// Create a JWT that carries the user's id.
// The token is deliberately small — we don't put role or email on it,
// because that would mean a logged-in user keeps old permissions until
// the token expires. Instead `authenticate` loads the fresh user on
// every request.
export function signAuthToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Verify a token. Returns the payload or throws.
export function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

// Options we use when writing the auth cookie.
//
//   httpOnly  — JavaScript (including XSS) cannot read it.
//   secure    — browsers only send it over HTTPS. Required in production.
//   sameSite  — "lax" blocks most CSRF while still allowing top-level
//               navigation. For stricter apps, "strict" is also fine.
//   maxAge    — matches JWT_EXPIRES_IN roughly. A stale cookie whose JWT
//               has expired will simply fail authentication.
//   path      — the cookie is sent to every endpoint under /.
export const AUTH_COOKIE_NAME = "token";

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
