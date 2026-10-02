/**
 * @file src/components/TaskItem.jsx
 * @author Bill Chen
 */
import { useState } from "react";
import "./TaskItem.css";

export default function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description);

  function saveEdit() {
    const title = draftTitle.trim();
    if (!title) return;
    onUpdate(task._id, { title, description: draftDescription.trim() });
    setEditing(false);
  }

  function cancelEdit() {
    setDraftTitle(task.title);
    setDraftDescription(task.description);
    setEditing(false);
  }

  return (
    <article
      className={`task-item ${task.completed ? "task-item--done" : ""}`}
    >
      <label className="task-item__check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task._id)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        />
      </label>

      <div className="task-item__body">
        {editing ? (
          <div className="task-item__edit">
            <input
              className="task-item__edit-input"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              aria-label="Edit title"
            />
            <textarea
              className="task-item__edit-input"
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={2}
              aria-label="Edit description"
            />
          </div>
        ) : (
          <>
            <h3 className="task-item__title">{task.title}</h3>
            {task.description ? (
              <p className="task-item__description">{task.description}</p>
            ) : null}
          </>
        )}
      </div>

      <div className="task-item__actions">
        {editing ? (
          <>
            <button className="btn btn--primary" onClick={saveEdit}>
              Save
            </button>
            <button className="btn btn--ghost" onClick={cancelEdit}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn--ghost"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="btn btn--danger"
              onClick={() => onDelete(task._id)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
