/**
 * @file src/pages/Home.jsx
 * @author Bill Chen
 * @description Week 7 — tasks are now PRIVATE to the authenticated user.
 *   If the user is anonymous we don't even hit the API; we show a prompt.
 */
import { useEffect, useState } from "react";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import { taskService } from "../services/taskService.js";
import "./Home.css";

export default function Home({ user, onRequireLogin }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await taskService.list();
        if (!cancelled) setTasks(data);
      } catch (err) {
        if (!cancelled) {
          // If the cookie expired between page load and now, the user
          // isn't really logged in. Bump them back to the login page.
          if (err.status === 401) {
            onRequireLogin?.();
            return;
          }
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, onRequireLogin]);

  async function addTask({ title, description }) {
    setError("");
    try {
      const created = await taskService.create({ title, description });
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      if (err.status === 401) return onRequireLogin?.();
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
      if (err.status === 401) return onRequireLogin?.();
      setError(err.message);
    }
  }

  async function updateTask(id, updates) {
    try {
      const updated = await taskService.update(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      if (err.status === 401) return onRequireLogin?.();
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    try {
      await taskService.remove(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      if (err.status === 401) return onRequireLogin?.();
      setError(err.message);
    }
  }

  if (!user) {
    return (
      <section className="home home--anonymous" aria-live="polite">
        <h2>Please sign in</h2>
        <p>
          Your tasks are private to your account.
          <br />
          Use the navigation above to log in or create a free account.
        </p>
      </section>
    );
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <section className="home">
      <p className="home__hello">
        Signed in as <strong>{user.name}</strong>. These tasks are yours.
      </p>

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
          Loading your tasks…
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
