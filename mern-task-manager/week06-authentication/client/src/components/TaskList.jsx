/**
 * @file src/components/TaskList.jsx
 * @author Bill Chen
 */
import TaskItem from "./TaskItem.jsx";
import "./TaskList.css";

export default function TaskList({ tasks, onToggle, onUpdate, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list__empty">
        <p>No tasks here yet.</p>
        <p className="task-list__empty-hint">
          Add one above, or switch the filter.
        </p>
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Tasks">
      {tasks.map((task) => (
        <li key={task._id}>
          <TaskItem
            task={task}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
