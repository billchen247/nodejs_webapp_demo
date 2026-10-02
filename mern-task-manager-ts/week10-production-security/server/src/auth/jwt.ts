/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/auth/jwt.ts
 *
 * JWT helpers for a short-access-token + refresh-token flow.
 *
 * Why two tokens instead of one 7-day JWT?
 *
 *   - If an attacker gets hold of a 7-day access token (XSS, log-leak,
 *     accidental screen-share), the entire session is theirs until
 *     expiry. We cannot proactively invalidate a stateless JWT.
 *   - With a short-lived access token (15m) and a refresh token stored
 *     on a separate cookie with a very narrow `path` (/api/auth/refresh),
 *     the window of compromise shrinks dramatically. A refresh token
 *     is sent *only* to the one endpoint that can mint access tokens.
 *   - Short-lived access tokens also mean that if we demote a user,
 *     they lose admin access on their next refresh (at most 15m later),
 *     without us having to maintain a revocation list.
 *
 * We tag each token with a `typ` claim so a refresh token cannot be
 * accidentally accepted as an access token or vice versa. Pinning
 * `algorithm: HS256` closes the famous "alg: none" / RS256-vs-HS256
 * confusion family of bugs.
 */
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_SECONDS } from "../config/security.js";

/** Shape of the data we embed in a token. Keep it minimal. */
export interface AuthTokenPayload {
  sub: string;
}

export type TokenType = "access" | "refresh";

interface InternalPayload extends AuthTokenPayload {
  typ: TokenType;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a long random value (32+ chars).",
    );
  }
  return secret;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  const body: InternalPayload = { ...payload, typ: "access" };
  return jwt.sign(body, getSecret(), {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  const body: InternalPayload = { ...payload, typ: "refresh" };
  return jwt.sign(body, getSecret(), {
    algorithm: "HS256",
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
}

/**
 * Verify a token. Returns the payload only if it's valid, unexpired,
 * and the embedded `typ` matches `expectedType`. Returning `null` on any
 * failure keeps the call sites short and makes the "fail closed" default
 * harder to get wrong than a thrown error.
 */
export function verifyAuthToken(
  token: string,
  expectedType: TokenType,
): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as { sub?: unknown }).sub === "string" &&
      (decoded as { typ?: unknown }).typ === expectedType
    ) {
      return { sub: (decoded as { sub: string }).sub };
    }
    return null;
  } catch {
    return null;
  }
}
