/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/auth/jwt.ts
 *
 * Tiny wrapper around jsonwebtoken.
 *
 * Why a wrapper?
 *   - Pins the algorithm to HS256 — stops a famous family of bugs where a
 *     verifier accepts "alg: none" or RS256 tokens meant for someone else.
 *   - Centralises the secret lookup so no caller has to remember the env
 *     variable name.
 *   - Makes the payload shape a TypeScript type so controllers get help
 *     from the compiler.
 */
import jwt from "jsonwebtoken";

/** Shape of the data we embed in a token. Keep it minimal. */
export interface AuthTokenPayload {
  /** The user's Mongo id, stringified. */
  sub: string;
}

/** The signing secret. In production, load this from a secret manager. */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a long random value (32+ chars).",
    );
  }
  return secret;
}

const DEFAULT_EXPIRES_IN = "7d" as const;

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), {
    algorithm: "HS256",
    expiresIn: DEFAULT_EXPIRES_IN,
  });
}

/**
 * Verify a token and return the payload, or `null` if invalid/expired.
 * Returning `null` instead of throwing keeps the call sites short.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as { sub?: unknown }).sub === "string"
    ) {
      return { sub: (decoded as { sub: string }).sub };
    }
    return null;
  } catch {
    return null;
  }
}
