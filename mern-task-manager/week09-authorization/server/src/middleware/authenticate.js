/**
 * @file src/middleware/authenticate.js
 * @author Bill Chen
 * @description authenticate — populate req.user with id, name, email, role.
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

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
