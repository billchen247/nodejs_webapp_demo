/**
 * @file src/App.jsx
 * @author Bill Chen
 * @description The App component is a thin shell around a single page.
 *   We will introduce routing in Week 8 once we have authentication.
 */
import Home from "./pages/Home.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Manager</h1>
        <p className="app__subtitle">Week 5 — Full MERN (React + Express + MongoDB)</p>
      </header>
      <main className="app__main">
        <Home />
      </main>
      <footer className="app__footer">
        <small>Tasks are stored in MongoDB — they survive refresh.</small>
      </footer>
    </div>
  );
}
