/**
 * @file src/App.jsx
 * @author Bill Chen
 * @description Top-level app component. Week 6 — top-level app state owns
 *   `user`. Week 8 will refactor this into a React Context + proper
 *   routing + ProtectedRoute. For now we keep everything in App so the
 *   lesson stays focused on *authentication*.
 */
import { useEffect, useState } from "react";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { authService } from "./services/authService.js";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [view, setView] = useState("home"); // "home" | "login" | "register"

  // On startup, ask the server if we're already logged in (via the cookie).
  useEffect(() => {
    (async () => {
      try {
        const { user } = await authService.me();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  function handleAuthenticated(user) {
    setUser(user);
    setView("home");
  }

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setView("home");
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 7 — Protected API + task ownership</p>
      </header>

      <NavBar
        user={user}
        view={view}
        onNavigate={setView}
        onLogout={handleLogout}
      />

      <main className="app__main">
        {bootstrapping ? (
          <p className="app__loading">Loading…</p>
        ) : view === "login" ? (
          <Login
            onAuthenticated={handleAuthenticated}
            onSwitchToRegister={() => setView("register")}
          />
        ) : view === "register" ? (
          <Register
            onAuthenticated={handleAuthenticated}
            onSwitchToLogin={() => setView("login")}
          />
        ) : (
          <Home user={user} onRequireLogin={() => setView("login")} />
        )}
      </main>

      <footer className="app__footer">
        <small>
          {user
            ? `Signed in as ${user.email} — your tasks are private.`
            : "Not signed in."}
        </small>
      </footer>
    </div>
  );
}
