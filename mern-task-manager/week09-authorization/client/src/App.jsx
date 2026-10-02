/**
 * @file src/App.jsx
 * @author Bill Chen
 * @description Top-level App shell. Renders the NavBar and the route
 *   table — public pages, auth-only pages behind ProtectedRoute, and the
 *   admin-only page behind AdminRoute.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/routes/ProtectedRoute.jsx";
import AdminRoute from "./components/routes/AdminRoute.jsx";
import HomeLanding from "./pages/HomeLanding.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import Admin from "./pages/Admin.jsx";
import Forbidden from "./pages/Forbidden.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 9 — Authorization (roles)</p>
      </header>

      <NavBar />

      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomeLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forbidden" element={<Forbidden />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app__footer">
        <small>Role-based access. Server-enforced on every endpoint.</small>
      </footer>
    </div>
  );
}
