/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/config/security.ts
 *
 * One place for all security-tunable knobs.
 *
 * Putting these in a single module makes a security review tractable:
 * reviewers can read one file and see what the app is doing, instead of
 * grepping for `maxAge:` and `expiresIn:` all over the codebase.
 */

/** Access-token lifetime. Short on purpose: the refresh flow handles
 *  renewal, so a leaked access token has a small window of usefulness. */
export const ACCESS_TOKEN_TTL = "15m" as const;

/** Refresh-token lifetime. Longer, because the user does not want to
 *  log in every 15 minutes. 7 days is a reasonable classroom default;
 *  real apps often go 30+ with a rotating refresh. */
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/** For cookies — same number, in milliseconds. */
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

/** Login/register/forgot-password share one aggressive limiter. */
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX = 20;

/** Everything else gets a looser limiter so a legitimate browser doing
 *  dozens of GETs isn't ever throttled. */
export const GENERAL_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const GENERAL_RATE_LIMIT_MAX = 300;

/** Password reset tokens are valid for an hour. Long enough for the user
 *  to notice the email; short enough that a stolen one goes stale quickly. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** `true` in production so cookies get `Secure` + `SameSite=none` plumbing
 *  that fits a HTTPS deployment. */
export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Returns a Boolean we can trust in tests. Tests set NODE_ENV = "test"
 *  which should behave like development. */
export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}
