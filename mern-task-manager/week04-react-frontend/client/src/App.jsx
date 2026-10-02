/**
 * @file src/App.jsx
 * @author Bill Chen
 * @description Top-level App shell.
 *
 * For Week 4 the UI is a single page (Home). Routing will arrive in
 * Week 8 once we have an authenticated user to protect routes for.
 */
import Home from "./pages/Home.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 4 — React frontend (mock data)</p>
      </header>
      <main className="app__main">
        <Home />
      </main>
      <footer className="app__footer">
        <small>Classroom demo — data is not persisted yet.</small>
      </footer>
    </div>
  );
}
