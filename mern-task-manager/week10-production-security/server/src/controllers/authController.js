/**
 * @file src/controllers/authController.js
 * @author Bill Chen
 * @description Auth controller — register / login / logout / me / forgot / reset.
 */
// Guarantees:
//   - `role` is NEVER read from the request body. New users default to "user".
//   - Login responses do not leak whether an account exists.
//   - Forgot-password returns 200 for any email so attackers can't
//     enumerate registered users.
//   - Password reset tokens are stored as a SHA-256 hash. Only the raw
//     token (sent in the email) can satisfy the lookup.

import bcrypt from "bcrypt";
import { User, ROLES } from "../models/User.js";
import {
  signAuthToken,
  AUTH_COOKIE_NAME,
  authCookieOptions,
} from "../config/auth.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  generateResetToken,
  hashResetToken,
} from "../utils/resetTokens.js";

const BCRYPT_ROUNDS = 12;

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.USER,
    });

    const token = signAuthToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    const invalid = () =>
      res.status(401).json({ error: "Invalid email or password" });

    if (!user) {
      // Still do a dummy compare to equalize timing — attackers who can
      // observe response times should not be able to tell whether an
      // email is registered.
      await bcrypt.compare(password, "$2b$12$abcdefghijklmnopqrstuv");
      return invalid();
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return invalid();

    const token = signAuthToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
    res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, { ...authCookieOptions(), maxAge: 0 });
  res.status(200).json({ ok: true });
}

export const me = [
  authenticate,
  (req, res) => {
    res.status(200).json({ user: req.user });
  },
];

// POST /api/auth/forgot-password
// Always returns 200 so that an attacker cannot discover which emails
// are registered. In development we log the reset link to the server
// console; in production you'd hand this to your email service.
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const { raw, hash, expiresAt } = generateResetToken();
      user.passwordResetTokenHash = hash;
      user.passwordResetExpires = expiresAt;
      await user.save();

      const resetUrl = `${env.PASSWORD_RESET_URL_BASE}?token=${raw}`;
      if (!env.IS_PROD) {
        console.log(
          `\n[password reset] for ${user.email}\n  link: ${resetUrl}\n  expires: ${expiresAt.toISOString()}\n`
        );
      } else {
        // TODO(production): hand `resetUrl` to your email service here.
      }
    }

    res.status(200).json({
      ok: true,
      message:
        "If an account with that email exists, we've sent a reset link.",
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
// Verifies the token (by hashing and matching), checks expiry, updates
// the password, and clears the reset fields.
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashResetToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select(
      "+passwordResetTokenHash +passwordResetExpires +passwordHash"
    );

    if (!user) {
      return res
        .status(400)
        .json({ error: "Reset link is invalid or has expired" });
    }

    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    // Deliberately do NOT auto-login. The user should sign in with the
    // new password so we're sure they typed what they meant.
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
