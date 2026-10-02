/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/auth/cookie.ts
 *
 * One place that knows how we store our two auth cookies.
 *
 * Design:
 *   - ACCESS cookie — path "/" so every API call carries it.
 *     Short lifetime (15m) matches the JWT inside.
 *   - REFRESH cookie — path "/api/auth" so it is ONLY sent to the
 *     refresh (and logout) endpoints. Any XSS that somehow leaked a
 *     fetch to `/api/tasks` cannot incidentally cause the browser to
 *     attach the refresh token.
 *
 * Both cookies are:
 *   - HttpOnly  — JavaScript cannot read them.
 *   - SameSite  — "lax" in dev; "none" in production (because the
 *                 React app is served from a different origin). "None"
 *                 forces `Secure`, which forces HTTPS. Good.
 *   - Secure    — on in production only, so http://localhost dev works.
 *
 * In Week 10 we also stop baking a hard-coded path for a single cookie
 * and expose two helpers (`setAuthCookies` / `clearAuthCookies`) so
 * the auth controllers do not have to know how the cookies are built.
 */
import type { Response } from "express";
import {
  REFRESH_TOKEN_TTL_MS,
  isProd,
} from "../config/security.js";

export const ACCESS_COOKIE_NAME = "mern_task_manager_access";
export const REFRESH_COOKIE_NAME = "mern_task_manager_refresh";

/** The access cookie lives for the same ~15 minutes the JWT does. */
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;

/** Refresh is scoped to /api/auth so it does not travel with every request. */
const REFRESH_COOKIE_PATH = "/api/auth";

function baseOptions() {
  const prod = isProd();
  return {
    httpOnly: true as const,
    // In production the client is served from a different origin, so we
    // must use SameSite=None (which requires Secure=true, i.e. HTTPS).
    sameSite: (prod ? "none" : "lax") as "none" | "lax",
    secure: prod,
  };
}

export function setAccessCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: REFRESH_COOKIE_PATH,
  });
}

export function setAuthCookies(
  res: Response,
  tokens: { access: string; refresh: string },
): void {
  setAccessCookie(res, tokens.access);
  setRefreshCookie(res, tokens.refresh);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...baseOptions(), path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
  });
}
