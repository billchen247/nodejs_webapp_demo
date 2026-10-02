/**
 * @file src/App.jsx
 * @author Bill Chen
 * @description Top-level route table for the Week 10 client — public pages,
 *   auth pages, and the protected/admin-guarded pages.
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
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 10 — Production security</p>
      </header>

      <NavBar />

      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomeLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
        <small>
          Hardened for production — helmet, rate limiting, input validation,
          hashed reset tokens, strict CORS.
        </small>
      </footer>
    </div>
  );
}
