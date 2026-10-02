/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: client/src/components/NavBar.tsx
 *
 * A tiny top bar that shows the current user and a Log out button.
 *
 * Why a separate component?
 *   The App shell now has to render on every route. Pulling the auth
 *   bar out keeps App.tsx readable and makes the test for "logout
 *   returns to login" trivially independent of the page body.
 */
import { useAuth } from "../context/AuthContext.js";
import { useNavigate } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout(): Promise<void> {
    await logout();
    // After logout we drop the user to /login. `replace` so that back
    // doesn't bring the authenticated page back visibly.
    navigate("/login", { replace: true });
  }

  return (
    <div className="app__authbar">
      <span className="app__authbar-user">
        Signed in as <strong>{user.name || user.email}</strong>
      </span>
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
