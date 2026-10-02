/**
 * @file src/middleware/requireRole.js
 * @author Bill Chen
 * @description requireRole — factory that produces a role-check middleware.
 */
// Usage: router.get("/users", authenticate, requireRole("admin"), handler);
//
// Returns:
//   401 if the request isn't authenticated at all (defensive — the shared
//       `authenticate` middleware should run first and catch this)
//   403 if the user is authenticated but lacks the required role
//
// 403 is the right status here. The admin route exists; we just don't let
// this particular user through. Compare with Week 7 where "someone else's
// task" returned 404 (hiding the existence of the resource).

export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
