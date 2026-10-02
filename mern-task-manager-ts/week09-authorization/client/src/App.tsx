/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: client/src/App.tsx
 *
 * The root component. New in Week 9:
 *
 *   - `/admin` route, wrapped in <RequireRole role="admin">.
 *   - The nav bar now shows an "Admin" link to users whose role is
 *     "admin".
 *
 * Carried over from Week 8:
 *   - <AuthProvider> wraps the whole tree so pages can call useAuth().
 *   - <ProtectedRoute> guards /tasks.
 *   - main.tsx owns <BrowserRouter>; this file does not — tests mount
 *     <App /> inside a <MemoryRouter> instead.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import NavBar from "./components/NavBar.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import RequireRole from "./components/RequireRole.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Admin from "./pages/Admin.js";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <header className="app__header">
          <h1 className="app__title">Task Manager</h1>
          <p className="app__subtitle">Week 9 — Authorization + admin dashboard</p>
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
            {/* Admin requires both: signed in AND role === "admin". */}
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <Admin />
                </RequireRole>
              }
            />
            <Route path="/" element={<Navigate to="/tasks" replace />} />
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
