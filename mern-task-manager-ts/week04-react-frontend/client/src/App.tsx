/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 04
 * File: client/src/App.tsx
 *
 * The root component. It renders the one page we have this week.
 *
 * In later weeks App will be where we mount a router (Week 8) and an
 * authentication provider (Week 8). Keeping it tiny for now makes those
 * additions easy to see.
 */
import Home from "./pages/Home.js";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 4 — React UI (mock data)</p>
      </header>
      <main className="app__main">
        <Home />
      </main>
      <footer className="app__footer">
        <small>MERN Task Manager — classroom project by Bill Chen</small>
      </footer>
    </div>
  );
}
