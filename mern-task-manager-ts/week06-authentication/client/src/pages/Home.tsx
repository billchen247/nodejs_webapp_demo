/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 06
 * File: client/src/pages/Home.tsx
 *
 * Home is now wired to the backend. The state model is still "one
 * array of tasks lives here", but mutations go through the API first
 * and the array is updated from the server's response.
 *
 * Why update from the server response instead of optimistically?
 *   Optimistic updates feel snappier but hide bugs: the UI may show
 *   state the server never agreed to. For a teaching app, the honest
 *   "wait then refresh" flow makes the client/server boundary visible.
 *   Optimistic UI is a good follow-up once the basics are solid.
 *
 * Why keep loading + error state in this component?
 *   Both are tied to the request lifecycle of this page. Lifting them
 *   into context would spread the complexity across the app without
 *   buying us anything until there are multiple pages that share it.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import TaskForm from "../components/TaskForm.js";
import TaskList from "../components/TaskList.js";
import { api, ApiError } from "../services/api.js";
import type { Task, TaskFilter } from "../types.js";
import "./Home.css";

/** Pull a user-facing message out of any error, including network failures. */
function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.listTasks();
      setTasks(next);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on mount. React 18 StrictMode fires effects twice in dev;
  // that is fine because listTasks is idempotent (GETs are safe to repeat).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visibleTasks = useMemo(() => {
    switch (filter) {
      case "active":
        return tasks.filter((t) => !t.completed);
      case "completed":
        return tasks.filter((t) => t.completed);
      case "all":
      default:
        return tasks;
    }
  }, [tasks, filter]);

  async function handleAdd(title: string, description: string): Promise<void> {
    try {
      const created = await api.createTask({ title, description });
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function handleToggle(id: string): Promise<void> {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    try {
      const updated = await api.updateTask(id, { completed: !current.completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(describeError(err));
    }
  }

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <section className="home">
      <TaskForm onAdd={handleAdd} />

      {error && (
        <div className="home__error" role="alert">
          <strong>Something went wrong:</strong> {error}
          <button
            type="button"
            className="home__retry"
            onClick={() => void refresh()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="home__controls">
        <div className="home__count" aria-live="polite">
          {activeCount} active · {tasks.length} total
        </div>
        <div
          className="home__filters"
          role="group"
          aria-label="Filter tasks"
        >
          {(["all", "active", "completed"] as TaskFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`home__filter${filter === f ? " home__filter--on" : ""}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="home__loading" role="status">
          Loading tasks…
        </p>
      ) : (
        <TaskList
          tasks={visibleTasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}
