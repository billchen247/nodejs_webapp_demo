/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 04
 * File: client/src/pages/Home.tsx
 *
 * The Home page owns the task state for Week 4.
 *
 * All mutations (add / toggle / delete) are plain `setTasks(prev => ...)`
 * calls — no network, no reducers, no context. Keeping state at the top
 * and threading callbacks down is the simplest React data-flow story and
 * is what every other pattern (Context, Redux, Zustand) is a reaction to.
 */
import { useMemo, useState } from "react";
import TaskForm from "../components/TaskForm.js";
import TaskList from "../components/TaskList.js";
import { mockTasks } from "../data/mockTasks.js";
import type { Task, TaskFilter } from "../types.js";
import "./Home.css";

/** Return a reasonably-unique id without pulling in a UUID library. */
function makeLocalId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");

  // useMemo so the filter does not re-run on every unrelated render.
  // With three tasks this is overkill; with 10,000 it would not be.
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

  function handleAdd(title: string, description: string): void {
    const newTask: Task = {
      id: makeLocalId(),
      title,
      description,
      completed: false,
    };
    // Immutable update: build a NEW array with the new task on top.
    setTasks((prev) => [newTask, ...prev]);
  }

  function handleToggle(id: string): void {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function handleDelete(id: string): void {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <section className="home">
      <TaskForm onAdd={handleAdd} />

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

      <TaskList
        tasks={visibleTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </section>
  );
}
