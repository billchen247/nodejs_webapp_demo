/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/components/RequireRole.tsx
 *
 * The authorization sibling of <ProtectedRoute>.
 *
 * ProtectedRoute asks "is anyone signed in?".
 * RequireRole asks "is the signed-in user allowed here?".
 *
 * Behaviour:
 *   - Not signed in → redirect to /login (same as ProtectedRoute).
 *   - Signed in but wrong role → render a 403-style "forbidden" screen.
 *     We intentionally do *not* silently redirect to /tasks: a user who
 *     deep-linked `/admin` deserves to know they landed on something
 *     they are not allowed to see.
 *
 * CRITICAL REMINDER FOR STUDENTS:
 *   This component is UX, not security. If someone opens DevTools and
 *   edits `user.role` in memory, this guard will happily let them in.
 *   The server will not. Every admin-only API route runs
 *   `requireAuth + requireRole("admin")` on the backend. Removing one
 *   button in React is never enough.
 */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import type { UserRole } from "../types.js";

interface RequireRoleProps {
  role: UserRole;
  children: ReactNode;
}

export default function RequireRole({ role, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p role="status" className="protected-route__loading">
        Checking session…
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== role) {
    return (
      <section className="forbidden" role="alert" data-testid="forbidden">
        <h2 className="forbidden__title">Forbidden</h2>
        <p className="forbidden__body">
          You don’t have permission to view this page.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
