/**
 * @file src/pages/TasksPage.jsx
 * @author Bill Chen
 * @description Week 8 — the Tasks page is behind a ProtectedRoute, so if we
 *   got here the user is signed in. We still react to 401 (e.g. cookie
 *   expired): clear local user state and the ProtectedRoute will redirect.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { taskService } from "../services/taskService.js";
import "./TasksPage.css";

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await taskService.list();
        if (!cancelled) setTasks(data);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          await refreshUser();
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser, navigate]);

  async function handle(fn) {
    try {
      await fn();
    } catch (err) {
      if (err.status === 401) {
        await refreshUser();
        navigate("/login", { replace: true });
        return;
      }
      setError(err.message);
    }
  }

  async function addTask(input) {
    setError("");
    await handle(async () => {
      const created = await taskService.create(input);
      setTasks((prev) => [created, ...prev]);
    });
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    await handle(async () => {
      const updated = await taskService.update(id, {
        completed: !task.completed,
      });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    });
  }

  async function updateTask(id, updates) {
    await handle(async () => {
      const updated = await taskService.update(id, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    });
  }

  async function deleteTask(id) {
    await handle(async () => {
      await taskService.remove(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    });
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <section className="tasks">
      <p className="tasks__hello">
        Signed in as <strong>{user.name}</strong>. These tasks are yours.
      </p>

      <TaskForm onSubmit={addTask} />

      <div className="tasks__toolbar" role="tablist" aria-label="Filter tasks">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`tasks__filter ${filter === f ? "tasks__filter--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="tasks__count">
          {visibleTasks.length} shown · {tasks.length} total
        </span>
      </div>

      {error ? (
        <div className="tasks__error" role="alert">
          <strong>Something went wrong.</strong> {error}
        </div>
      ) : null}

      {loading ? (
        <div className="tasks__loading" aria-live="polite">
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
