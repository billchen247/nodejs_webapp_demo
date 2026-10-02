/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: client/src/components/ProtectedRoute.tsx
 *
 * Wraps a route so unauthenticated visitors are redirected to /login.
 *
 * Why not just `if (!user) return <Login />`?
 *   Because the URL would still say /tasks. Reading the URL and the
 *   screen out loud would disagree. `<Navigate replace />` fixes that:
 *   the browser's address bar changes to /login, and the back button
 *   does not resurrect a "stuck" protected URL.
 *
 * Why `replace`?
 *   So that pressing the back button after being bounced to /login does
 *   not take the user back to the protected page they just failed to
 *   reach. Without `replace` they would ping-pong between the two.
 *
 * Why the `from` location state?
 *   After a successful login, Login reads this value and sends the user
 *   back to where they were trying to go. Deep links then work: a user
 *   who pastes `/tasks` while logged out ends up on /tasks (not /) after
 *   signing in.
 */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // While we are still asking /me who we are, don't flash the login
    // page at a user who is actually signed in — that is jarring and
    // forces an avoidable second render.
    return (
      <p role="status" className="protected-route__loading">
        Checking session…
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
