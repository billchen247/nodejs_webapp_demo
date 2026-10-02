/**
 * @file src/components/routes/AdminRoute.jsx
 * @author Bill Chen
 * @description Route guard that requires both authentication and the
 *   admin role before rendering its children.
 */
// AdminRoute — like ProtectedRoute, but also requires the admin role.
// Hiding this route from non-admins is purely a UX improvement.
// The /api/users endpoint on the server enforces the real check.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app__loading" role="status" aria-live="polite">
        Checking your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
