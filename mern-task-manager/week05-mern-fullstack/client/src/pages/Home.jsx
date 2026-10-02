/**
 * @file src/pages/Home.jsx
 * @author Bill Chen
 * @description Week 5 — tasks now come from the real API. We model three
 *   UI states:
 *   - loading
 *   - error
 *   - ready (with data)
 */
import { useEffect, useState } from "react";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import { taskService } from "../services/taskService.js";
import "./Home.css";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load tasks on mount. useEffect with [] runs once after the first render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await taskService.list();
        if (!cancelled) setTasks(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addTask({ title, description }) {
    // Optimistically clear any previous error so the user sees fresh feedback.
    setError("");
    try {
      const created = await taskService.create({ title, description });
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    try {
      const updated = await taskService.update(id, {
        completed: !task.completed,
      });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateTask(id, updates) {
    try {
      const updated = await taskService.update(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    try {
      await taskService.remove(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
    }
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

      {error ? (
        <div className="home__error" role="alert">
          <strong>Something went wrong.</strong> {error}
        </div>
      ) : null}

      {loading ? (
        <div className="home__loading" aria-live="polite">
          Loading tasks…
        </div>
      ) : (
        <TaskList
          tasks={visibleTasks}
          onToggle={toggleTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </section>
  );
}
