/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: server/src/auth/cookie.ts
 *
 * One place that knows how we store an auth token in a cookie.
 *
 * Why a cookie, and why HTTP-only?
 *   - HTTP-only cookies cannot be read by JavaScript on the page. That
 *     makes an XSS vulnerability dramatically less valuable to an attacker
 *     — they cannot simply slurp localStorage and walk away with your
 *     session.
 *   - The browser attaches the cookie automatically on every request. The
 *     React code never has to touch the token.
 *
 * Trade-off: cookies are automatically attached by the browser on
 * cross-origin requests only if we opt in with `credentials: "include"`
 * on the client *and* `credentials: true` on the CORS config. That is why
 * `app.ts` sets `credentials: true` this week.
 *
 * `sameSite: "lax"` is a reasonable default for a classic MERN app: it
 * blocks CSRF on cross-site POST navigations while still allowing links
 * that follow a normal top-level redirect. In Week 10 we revisit this.
 */
import type { Response } from "express";

export const AUTH_COOKIE_NAME = "mern_task_manager_auth";

/** Set the auth cookie on the response. */
export function setAuthCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // `secure` requires HTTPS. We only turn it on in production so local
    // development on plain http://localhost still works.
    secure: isProd,
    // Match the JWT expiry so the cookie clears itself even if we forget
    // to call logout.
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

/** Clear the auth cookie. Uses the same options so the browser accepts it. */
export function clearAuthCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });
}
