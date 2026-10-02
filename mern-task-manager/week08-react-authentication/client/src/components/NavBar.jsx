/**
 * @file src/components/NavBar.jsx
 * @author Bill Chen
 * @description Primary navigation bar. Shows auth-aware links: Tasks +
 *   greeting + Log out when signed in, Log in + Sign up when anonymous.
 */
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./NavBar.css";

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar" aria-label="Primary">
      <ul className="navbar__list">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Home
          </NavLink>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
              >
                Tasks
              </NavLink>
            </li>
            <li className="navbar__user">
              Hi, <strong>{user.name}</strong>
            </li>
            <li>
              <button
                className="navbar__link"
                onClick={logout}
                aria-label="Log out"
              >
                Log out
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
              >
                Log in
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
              >
                Sign up
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
