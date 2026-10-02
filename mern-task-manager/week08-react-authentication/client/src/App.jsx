/**
 * @file src/App.jsx
 * @author Bill Chen
 * @description Top-level App shell with React Router routes.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/routes/ProtectedRoute.jsx";
import HomeLanding from "./pages/HomeLanding.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import "./App.css";

// Week 8 — real routing + a top-level AuthProvider (see main.jsx).

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 8 — React authentication + routing</p>
      </header>

      <NavBar />

      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomeLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app__footer">
        <small>Routing by React Router. Security still lives on the server.</small>
      </footer>
    </div>
  );
}
