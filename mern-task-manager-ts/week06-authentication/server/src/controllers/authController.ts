/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: server/src/controllers/authController.ts
 *
 * Register, login, logout, me.
 *
 * Design notes:
 *   - We respond with the full `user` JSON on register and login. The
 *     client can then show a greeting without a second request.
 *   - A bad email or a bad password both return the same 401 message
 *     ("Invalid email or password"). Different messages leak which half
 *     of the credential pair was wrong — a known enumeration vector.
 *   - Logout always succeeds, even if the cookie is missing. The API is
 *     idempotent and avoids distinguishing "already logged out" from
 *     "just logged out".
 *   - `/me` is public: anyone can call it. If the cookie is missing or
 *     invalid we return 200 with `user: null`. React finds that easier
 *     to work with than a 401 at mount time.
 */
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { User, hashPassword, verifyPassword } from "../models/User.js";
import { signAuthToken, verifyAuthToken } from "../auth/jwt.js";
import { AUTH_COOKIE_NAME, clearAuthCookie, setAuthCookie } from "../auth/cookie.js";

interface RegisterBody {
  email?: unknown;
  password?: unknown;
  name?: unknown;
}

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, name } = (req.body ?? {}) as RegisterBody;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 8) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
      return;
    }

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await User.create({
        email,
        passwordHash,
        name: isNonEmptyString(name) ? name : "",
      });
    } catch (err) {
      if (
        err instanceof mongoose.mongo.MongoServerError &&
        err.code === 11000
      ) {
        // Unique-index collision on email. 409 Conflict is the honest status
        // code; the message intentionally does not say "that email is taken"
        // in detail — a tighter policy would log and respond generically.
        res.status(409).json({ error: "Email is already registered" });
        return;
      }
      if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          error: "Validation failed",
          details: Object.fromEntries(
            Object.entries(err.errors).map(([k, e]) => [k, e.message]),
          ),
        });
        return;
      }
      throw err;
    }

    const token = signAuthToken({ sub: user.id });
    setAuthCookie(res, token);

    res.status(201).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = (req.body ?? {}) as LoginBody;
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // We need the hash this time, so opt in with .select("+passwordHash").
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash",
    );
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signAuthToken({ sub: user.id });
    setAuthCookie(res, token);
    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.status(200).json({ ok: true });
}

/**
 * `/api/auth/me` — "who am I?"
 * Returns the current user or `{ user: null }` if the cookie is absent or
 * invalid. Never responds 401 so the React app can call it on mount
 * without plumbing a special case for "not logged in".
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = (req.cookies ?? {})[AUTH_COOKIE_NAME] as string | undefined;
    if (!token) {
      res.status(200).json({ user: null });
      return;
    }
    const payload = verifyAuthToken(token);
    if (!payload) {
      // Clear a stale cookie so the browser does not keep sending it.
      clearAuthCookie(res);
      res.status(200).json({ user: null });
      return;
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      clearAuthCookie(res);
      res.status(200).json({ user: null });
      return;
    }
    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}
