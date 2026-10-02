/**
 * @file src/controllers/authController.js
 * @author Bill Chen
 */
// Auth controller — register / login / logout / me.
// Password hashing uses bcrypt. The JWT is sent to the browser as an
// HTTP-only cookie so JavaScript (and XSS) cannot read it.

import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import {
  signAuthToken,
  verifyAuthToken,
  AUTH_COOKIE_NAME,
  authCookieOptions,
} from "../config/auth.js";

const BCRYPT_ROUNDS = 12;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== "string") return badRequest(res, "name is required");
    if (!email || typeof email !== "string") return badRequest(res, "email is required");
    if (!password || typeof password !== "string" || password.length < 8) {
      return badRequest(res, "password must be at least 8 characters");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      // Deliberately generic — never leak whether an email is already taken
      // in a password-sensitive flow. (In class this is a good discussion.)
      return res.status(409).json({ error: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = signAuthToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    if (err?.name === "ValidationError") {
      return badRequest(res, err.message);
    }
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return badRequest(res, "email and password are required");
    }

    // Password field is select:false in the schema; we need an explicit select.
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      "+passwordHash"
    );

    // Use a generic error so attackers can't tell valid emails from invalid ones.
    const invalid = () => res.status(401).json({ error: "Invalid email or password" });
    if (!user) return invalid();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return invalid();

    const token = signAuthToken(user._id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
    res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export function logout(req, res) {
  // Clear the cookie by setting the same name/path with maxAge: 0.
  res.clearCookie(AUTH_COOKIE_NAME, { ...authCookieOptions(), maxAge: 0 });
  res.status(200).json({ ok: true });
}

// GET /api/auth/me
// Returns the current authenticated user, or 401 if the cookie is missing/invalid.
// Note: Week 7 will introduce a real `authenticate` middleware. For now we
// decode the cookie inline so the lesson stays focused on auth itself.
export async function me(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}
