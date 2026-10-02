/**
 * @file src/pages/Home.jsx
 * @author Bill Chen
 * @description The one and only page for Week 4. All task state lives
 *   locally in this component — we have not wired up the API yet.
 *
 * Learning goals:
 *   - See how `useState` holds the task list.
 *   - Observe that passing callbacks (`onToggle`, `onUpdate`, …) is how
 *     children communicate "upward" in React.
 *   - Watch how filtering can be derived from state at render time
 *     without needing a separate `useState` for `visibleTasks`.
 */
import { useState } from "react";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import "./Home.css";

// Mock data for Week 4. Nothing talks to the backend yet.
// We will replace this with real API calls in Week 5.
const INITIAL_TASKS = [
  {
    id: "1",
    title: "Learn JSX",
    description: "Elements, attributes, children.",
    completed: true,
  },
  {
    id: "2",
    title: "Understand useState",
    description: "React re-renders when state changes.",
    completed: false,
  },
  {
    id: "3",
    title: "Build the task list UI",
    description: "List, create, edit, delete, complete, filter.",
    completed: false,
  },
];

/**
 * A tiny id helper that is safe in all browsers. `crypto.randomUUID` is
 * available in modern browsers; the fallback is for very old ones.
 */
export function newId() {
  return (
    (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
    `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  );
}

export default function Home() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState("all"); // all | active | completed

  function addTask({ title, description }) {
    setTasks((prev) => [
      { id: newId(), title, description, completed: false },
      ...prev,
    ]);
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function updateTask(id, updates) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <section className="home">
      <TaskForm onSubmit={addTask} />

      <div className="home__toolbar" role="tablist" aria-label="Filter tasks">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`home__filter ${filter === f ? "home__filter--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="home__count">
          {visibleTasks.length} shown · {tasks.length} total
        </span>
      </div>

      <TaskList
        tasks={visibleTasks}
        onToggle={toggleTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </section>
  );
}
