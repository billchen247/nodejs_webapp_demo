/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/middleware/rateLimiters.ts
 *
 * Rate limiters.
 *
 * Why have them?
 *   - Credential stuffing / password guessing against /login: a limiter
 *     turns "try 10 million passwords" into "try 20 passwords per IP
 *     per 15 minutes", which is a very different attack.
 *   - Signup spam against /register: ties up DB rows and clogs email
 *     reset flows.
 *   - Password-reset enumeration against /forgot-password: forcing a
 *     low rate makes the "which emails exist" probe uneconomical.
 *
 * Why two different limiters?
 *   The auth endpoints are the hot spots. We put them behind a strict
 *   limiter. The rest of the API gets a looser limiter so a React app
 *   doing a burst of normal GETs is never throttled.
 *
 * Why keep them in-memory (no Redis)?
 *   For a single-node classroom app, in-memory is fine and transparent.
 *   For a horizontally-scaled production app you would plug in a shared
 *   store (`rate-limit-redis`) so one instance's limiter decisions apply
 *   everywhere.
 */
import rateLimit from "express-rate-limit";
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
  GENERAL_RATE_LIMIT_MAX,
  GENERAL_RATE_LIMIT_WINDOW_MS,
  isTest,
} from "../config/security.js";

/**
 * The limiter the test suite installs. Tests should not be throttled —
 * each run would otherwise rely on timing, which is a classic source of
 * flaky tests. We disable rate limiting entirely under NODE_ENV=test.
 */
const skipDuringTests = (): boolean => isTest();

/** Strict limiter for login/register/forgot-password/reset-password. */
export const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  // Return the error body our client already understands.
  message: { error: "Too many requests. Try again later." },
  // Report hits via the modern RateLimit-* headers, hide the legacy ones.
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipDuringTests,
});

/** Looser limiter for the rest of the API. */
export const generalLimiter = rateLimit({
  windowMs: GENERAL_RATE_LIMIT_WINDOW_MS,
  limit: GENERAL_RATE_LIMIT_MAX,
  message: { error: "Too many requests. Try again later." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipDuringTests,
});
