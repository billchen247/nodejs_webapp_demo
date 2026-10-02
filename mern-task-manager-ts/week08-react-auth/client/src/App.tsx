/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: client/src/App.tsx
 *
 * The root component. New in Week 8:
 *
 *   - Mounts an <AuthProvider> so every page can read `useAuth()`.
 *   - Uses React Router to route between /login, /register and /tasks.
 *   - The task page lives behind <ProtectedRoute>, which redirects
 *     unauthenticated users to /login and preserves the attempted URL
 *     so they can be sent back there after signing in.
 *
 * Note that main.tsx is where <BrowserRouter> is mounted — not here —
 * so that tests can mount <App /> inside a <MemoryRouter> without us
 * accidentally nesting two routers.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import NavBar from "./components/NavBar.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <header className="app__header">
          <h1 className="app__title">Task Manager</h1>
          <p className="app__subtitle">Week 8 — React Router + AuthContext</p>
          <NavBar />
        </header>

        <main className="app__main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            {/* "/" is a convenience redirect to the only real page. */}
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            {/* Any unknown URL ends up on /tasks (which may bounce to /login). */}
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </main>

        <footer className="app__footer">
          <small>MERN Task Manager — classroom project by Bill Chen</small>
        </footer>
      </div>
    </AuthProvider>
  );
}
