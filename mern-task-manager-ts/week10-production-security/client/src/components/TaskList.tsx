/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: client/src/components/TaskList.tsx
 *
 * Renders a list of TaskItem components, or an empty-state placeholder.
 *
 * Why a dedicated "empty state"?
 *   A blank list is confusing — users wonder whether they're logged in,
 *   whether the data loaded, or whether the app is broken. An explicit
 *   message answers all three.
 */
import TaskItem from "./TaskItem.js";
import type { Task } from "../types.js";
import "./TaskList.css";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="task-list__empty" role="status">
        No tasks here yet. Add one above.
      </p>
    );
  }

  return (
    <ul className="task-list" aria-label="Tasks">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
