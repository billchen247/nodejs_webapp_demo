/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: client/src/App.tsx
 *
 * The root component. New in Week 6:
 *   - Calls `/api/auth/me` on mount to learn who (if anyone) is logged in.
 *   - Renders Login / Register when there is no user, Home when there is.
 *   - Shows an auth bar with the user's email + a Logout button.
 *
 * The state model is still bare-bones state + callbacks. Week 8 refactors
 * this into a proper AuthContext + React Router app.
 */
import { useCallback, useEffect, useState } from "react";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import { api } from "./services/api.js";
import type { AuthUser } from "./types.js";
import "./App.css";

type AuthView = "login" | "register";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState<AuthView>("login");

  const refreshMe = useCallback(async () => {
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch {
      // `/me` is designed never to 4xx; a thrown error means the network
      // itself failed, which we treat the same as "not logged in".
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  async function handleLogout(): Promise<void> {
    try {
      await api.auth.logout();
    } finally {
      // Even if the request failed we drop the user locally — the cookie
      // might have expired, in which case the server already forgot us.
      setUser(null);
      setAuthView("login");
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 7 — your tasks, protected and private</p>
        {user ? (
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
        ) : null}
      </header>

      <main className="app__main">
        {checkingAuth ? (
          <p role="status">Checking session…</p>
        ) : user ? (
          <Home />
        ) : authView === "login" ? (
          <Login
            onAuthenticated={(u) => setUser(u)}
            onSwitchToRegister={() => setAuthView("register")}
          />
        ) : (
          <Register
            onAuthenticated={(u) => setUser(u)}
            onSwitchToLogin={() => setAuthView("login")}
          />
        )}
      </main>

      <footer className="app__footer">
        <small>MERN Task Manager — classroom project by Bill Chen</small>
      </footer>
    </div>
  );
}
