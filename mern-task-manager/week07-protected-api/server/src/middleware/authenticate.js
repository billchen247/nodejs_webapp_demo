/**
 * @file src/middleware/authenticate.js
 * @author Bill Chen
 * @description Reusable authentication middleware.
 *   Reads the JWT from the HTTP-only cookie, verifies it, and attaches
 *   a safe user shape to `req.user`.
 *
 *   It never trusts anything the client claims about identity (e.g. an
 *   X-User header or a userId in the request body). The user id ALWAYS
 *   comes from the signed token the server itself issued.
 */

import { User } from "../models/User.js";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../config/auth.js";

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // We re-fetch the user so a revoked / deleted account can't keep acting.
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}
