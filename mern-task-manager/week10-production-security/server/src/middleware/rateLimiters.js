/**
 * @file src/middleware/rateLimiters.js
 * @author Bill Chen
 * @description Rate limiters.
 *
 * We use three tiers:
 *   - apiLimiter: a generous global cap so a single bad client cannot
 *     DoS the API by hammering a cheap endpoint.
 *   - authLimiter: tight cap on login/register/forgot/reset to make
 *     online brute-force extremely slow.
 *   - writeLimiter: moderate cap on data-mutating task endpoints.
 *
 * The rate-limiter keys on the client IP, so TRUST_PROXY matters when
 * the app is behind Nginx/Fly/Render. If TRUST_PROXY is wrong, every
 * request looks like it comes from the proxy and legitimate users
 * share the budget — set it correctly in .env.
 *
 * Under automated tests (NODE_ENV=test) we swap every limiter for a
 * passthrough middleware. A real limiter sharing a fixed window across
 * dozens of fast integration tests would start returning 429s that have
 * nothing to do with the behavior under test — disabling rate limiting
 * in test is standard production practice, not a workaround for a bug.
 */

import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const WINDOW_MS = env.RATE_LIMIT_WINDOW_SECONDS * 1000;

const COMMON = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Only count genuine HTTP errors against the quota — not JSON parse 400s
  // that the client typically retries intentionally.
  message: { error: "Too many requests, please slow down." },
};

// A no-op middleware used in place of a real limiter under test.
function passthroughLimiter(req, res, next) {
  next();
}

// Wrap `rateLimit(options)` so test runs get the passthrough instead.
function createLimiter(options) {
  if (process.env.NODE_ENV === "test") return passthroughLimiter;
  return rateLimit(options);
}

export const apiLimiter = createLimiter({
  windowMs: WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  ...COMMON,
});

export const authLimiter = createLimiter({
  windowMs: WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  // Only count failures — otherwise the honest "I just logged in" case
  // burns through the quota for the entire household behind one NAT.
  skipSuccessfulRequests: true,
  ...COMMON,
});

export const writeLimiter = createLimiter({
  windowMs: WINDOW_MS,
  // Roughly one write every 3 seconds, averaged over the window.
  limit: Math.max(50, Math.floor(env.RATE_LIMIT_MAX / 2)),
  ...COMMON,
});
