/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/components/NavBar.tsx
 *
 * Top bar: current user, nav links, log-out button.
 *
 * New in Week 9: role-aware links. If the signed-in user is an admin,
 * we also render a link to /admin. Everyone else does not even see it.
 *
 * To repeat: this is a UX nicety, not a security control. The /admin
 * route and the /api/users endpoints are both independently enforced
 * on their own layer. Hiding a link only means fewer users accidentally
 * click into a page that would deny them anyway.
 */
import { useAuth } from "../context/AuthContext.js";
import { NavLink, useNavigate } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout(): Promise<void> {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app__authbar">
      <div className="app__authbar-left">
        <span className="app__authbar-user">
          Signed in as <strong>{user.name || user.email}</strong>
          <span className={`app__authbar-role app__authbar-role--${user.role}`}>
            {user.role}
          </span>
        </span>
        <nav className="app__authbar-nav" aria-label="Primary">
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `app__authbar-link${isActive ? " app__authbar-link--active" : ""}`
            }
          >
            Tasks
          </NavLink>
          {user.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `app__authbar-link${isActive ? " app__authbar-link--active" : ""}`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
      </div>
      <button
        type="button"
        className="app__authbar-logout"
        onClick={() => void handleLogout()}
      >
        Log out
      </button>
    </div>
  );
}
