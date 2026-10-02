/**
 * @file src/components/NavBar.jsx
 * @author Bill Chen
 * @description Simple navigation bar. Week 6 keeps it minimal — in Week 8
 *   it will be aware of the full authentication state and routing.
 */
import "./NavBar.css";
export default function NavBar({ user, view, onNavigate, onLogout }) {
  return (
    <nav className="navbar" aria-label="Primary">
      <ul className="navbar__list">
        <li>
          <button
            className={`navbar__link ${view === "home" ? "navbar__link--active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            Tasks
          </button>
        </li>
        {!user ? (
          <>
            <li>
              <button
                className={`navbar__link ${view === "login" ? "navbar__link--active" : ""}`}
                onClick={() => onNavigate("login")}
              >
                Log in
              </button>
            </li>
            <li>
              <button
                className={`navbar__link ${view === "register" ? "navbar__link--active" : ""}`}
                onClick={() => onNavigate("register")}
              >
                Sign up
              </button>
            </li>
          </>
        ) : (
          <>
            <li className="navbar__user">
              Hi, <strong>{user.name}</strong>
            </li>
            <li>
              <button className="navbar__link" onClick={onLogout}>
                Log out
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
