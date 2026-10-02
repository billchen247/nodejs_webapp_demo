/**
 * @file src/components/NavBar.jsx
 * @author Bill Chen
 * @description Primary navigation. Adapts to auth state: shows Log
 *   in/Sign up for anonymous visitors, or Tasks/Admin (role-gated)/Log out
 *   for signed-in users.
 */
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./NavBar.css";

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = isAuthenticated && user.role === "admin";

  return (
    <nav className="navbar" aria-label="Primary">
      <ul className="navbar__list">
        <li>
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <NavLink to="/tasks" className={navClass}>
                Tasks
              </NavLink>
            </li>
            {isAdmin ? (
              <li>
                <NavLink to="/admin" className={navClass}>
                  Admin
                </NavLink>
              </li>
            ) : null}
            <li className="navbar__user">
              Hi, <strong>{user.name}</strong>
              {isAdmin ? (
                <span className="navbar__badge navbar__badge--admin">admin</span>
              ) : null}
            </li>
            <li>
              <button className="navbar__link" onClick={logout}>
                Log out
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={navClass}>
                Log in
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className={navClass}>
                Sign up
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

function navClass({ isActive }) {
  return `navbar__link ${isActive ? "navbar__link--active" : ""}`;
}
