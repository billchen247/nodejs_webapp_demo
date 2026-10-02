/**
 * @file src/controllers/authController.js
 * @author Bill Chen
 * @description Auth controller — register / login / logout / me.
 *   Note: `role` is NEVER read from the request body. New users default to "user".
 */
import bcrypt from "bcrypt";
import { User, ROLES } from "../models/User.js";
import {
  signAuthToken,
  AUTH_COOKIE_NAME,
  authCookieOptions,
} from "../config/auth.js";
import { authenticate } from "../middleware/authenticate.js";

const BCRYPT_ROUNDS = 12;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

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
      return res.status(409).json({ error: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    // role is explicitly set from the server. We ignore anything the client sends.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.USER,
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

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return badRequest(res, "email and password are required");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      "+passwordHash"
    );
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
