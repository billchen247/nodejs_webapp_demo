/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/components/TaskItem.tsx
 *
 * A single row in the task list.
 *
 * Pure presentational component: it does not own any state of its own. It
 * is told what task to display and which callbacks to call. That makes it
 * trivial to test and easy to reuse.
 */
import type { Task } from "../types.js";
import "./TaskItem.css";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const checkboxId = `task-${task.id}-done`;

  return (
    <li
      className={`task-item${task.completed ? " task-item--done" : ""}`}
      data-testid={`task-${task.id}`}
    >
      <input
        id={checkboxId}
        className="task-item__checkbox"
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.completed ? "not done" : "done"}`}
      />
      <label htmlFor={checkboxId} className="task-item__body">
        <span className="task-item__title">{task.title}</span>
        {task.description && (
          <span className="task-item__description">{task.description}</span>
        )}
      </label>
      <button
        type="button"
        className="task-item__delete"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete "${task.title}"`}
      >
        Delete
      </button>
    </li>
  );
}
