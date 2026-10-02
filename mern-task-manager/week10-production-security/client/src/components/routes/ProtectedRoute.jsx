/**
 * @file src/components/routes/ProtectedRoute.jsx
 * @author Bill Chen
 * @description Route guard that redirects anonymous visitors to /login,
 *   remembering the originally requested path for a post-login redirect.
 */
// ProtectedRoute — redirects anonymous users to /login and remembers
// where they were going, so after login we can send them back.
//
// This is a *client-side* convenience. It is NOT security. The real
// security boundary is the Express API in week07+.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
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

  return children;
}
