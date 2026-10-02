/**
 * @file src/config/auth.js
 * @author Bill Chen
 * @description Centralized auth configuration + helpers.
 *   Keeping JWT and cookie options in one file means we won't drift later.
 */
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const NODE_ENV = process.env.NODE_ENV || "development";

if (!JWT_SECRET || JWT_SECRET === "replace-with-a-long-random-secret") {
  console.warn(
    "WARNING: JWT_SECRET is not set to a strong value. Fix this in .env."
  );
}

// Create a JWT that carries the user's id.
export function signAuthToken(userId) {
  return jwt.sign({ sub: userId.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Verify a token. Returns the payload or throws.
export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Options we use when writing the auth cookie.
// `httpOnly` means JavaScript (XSS) cannot read it.
// `secure` is required in production (HTTPS).
// `sameSite: "lax"` is a sensible default for most flows.
export const AUTH_COOKIE_NAME = "token";

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    // 7 days by default — matches JWT_EXPIRES_IN roughly
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
