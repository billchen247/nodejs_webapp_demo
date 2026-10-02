/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/controllers/authController.ts
 *
 * Register, login, logout, me, refresh, forgot-password, reset-password.
 *
 * Design notes:
 *   - Validation runs at the router (zod) so by the time these handlers
 *     see `req.body`, every field has already been checked and
 *     normalised. The controllers can be unapologetically short.
 *   - A bad email or a bad password both return the same 401 message
 *     ("Invalid email or password"). Different messages leak which
 *     half of the credential pair was wrong.
 *   - `forgot-password` ALWAYS responds 200 — regardless of whether
 *     the email exists. Returning "no such user" would turn the
 *     endpoint into a cheap user-enumeration oracle.
 *   - In development only, `forgot-password` returns the reset token
 *     in the response body so students can test the flow without a
 *     real email provider. The response includes a `devToken` field
 *     with a very loud "dev only" comment. Production code would send
 *     the token via a one-time email instead.
 */
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
  User,
  createResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAuthToken,
} from "../auth/jwt.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  setAuthCookies,
} from "../auth/cookie.js";
import { PASSWORD_RESET_TTL_MS, isProd } from "../config/security.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
} from "../schemas/authSchemas.js";

function mintSession(res: Response, userId: string): void {
  setAuthCookies(res, {
    access: signAccessToken({ sub: userId }),
    refresh: signRefreshToken({ sub: userId }),
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Validation has already happened at the router.
    const { email, password, name } = req.body as RegisterBody;

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await User.create({
        email,
        passwordHash,
        name: name ?? "",
        // No `role` here. The schema default pins it to "user".
      });
    } catch (err) {
      if (
        err instanceof mongoose.mongo.MongoServerError &&
        err.code === 11000
      ) {
        res.status(409).json({ error: "Email is already registered" });
        return;
      }
      throw err;
    }

    mintSession(res, user.id);
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
    const { email, password } = req.body as LoginBody;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    mintSession(res, user.id);
    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookies(res);
  res.status(200).json({ ok: true });
}

/**
 * `/api/auth/me` — "who am I?". Returns 200 with `user: null` when the
 * caller has no valid access cookie. React finds that easier to work
 * with than a 401 at mount time.
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = (req.cookies ?? {})[ACCESS_COOKIE_NAME] as string | undefined;
    if (!token) {
      res.status(200).json({ user: null });
      return;
    }
    const payload = verifyAuthToken(token, "access");
    if (!payload) {
      clearAuthCookies(res);
      res.status(200).json({ user: null });
      return;
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      clearAuthCookies(res);
      res.status(200).json({ user: null });
      return;
    }
    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * `/api/auth/refresh` — exchange a refresh token for a fresh access
 * token. The browser only sends the refresh cookie to /api/auth/* (we
 * set the cookie `path` that narrowly), so this endpoint receives it
 * directly without us needing to pass it around.
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = (req.cookies ?? {})[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const payload = verifyAuthToken(token, "refresh");
    if (!payload) {
      clearAuthCookies(res);
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      clearAuthCookies(res);
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Mint a fresh access token. We leave the refresh cookie in place.
    // Rotating refresh tokens on every refresh is more secure (makes
    // stolen refresh tokens detectable because the real user's
    // refresh suddenly stops working) but adds state we don't need yet.
    mintSession(res, user.id);
    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordBody;

    // We always respond 200. If we 404'd on an unknown email, the
    // endpoint becomes a user-enumeration oracle.
    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({ ok: true });
      return;
    }

    const { token, hash } = createResetToken();
    user.set("resetTokenHash", hash);
    user.set("resetTokenExpiresAt", new Date(Date.now() + PASSWORD_RESET_TTL_MS));
    await user.save();

    // In production this would be sent via email. The classroom app has
    // no email provider configured, so for DEVELOPMENT ONLY we expose
    // the plaintext token in the response body with a very loud flag.
    // Students should see that the token leaves the server exactly once,
    // and that this is NOT how production should be shipped.
    if (!isProd()) {
      res.status(200).json({
        ok: true,
        devToken: token,
        devHint:
          "This field is only present in non-production environments. In production, deliver the token by email.",
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, newPassword } = req.body as ResetPasswordBody;
    const hash = hashResetToken(token);

    // Find by the HASH of the token, not the token itself. If the DB
    // ever leaks, no attacker can replay these fields to log in.
    const user = await User.findOne({ resetTokenHash: hash }).select(
      "+resetTokenHash +resetTokenExpiresAt",
    );
    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }
    const expiresAt = user.get("resetTokenExpiresAt") as Date | null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    user.set("passwordHash", await hashPassword(newPassword));
    // Burn the token — single use only. Even if the user clicks the
    // link twice, the second attempt gets a clean "invalid or expired".
    user.set("resetTokenHash", null);
    user.set("resetTokenExpiresAt", null);
    await user.save();

    // Deliberately do NOT auto-log the user in. Making them sign in
    // afterwards is a small UX cost in exchange for one less tricky
    // flow where "I reset my password and immediately got a session".
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
