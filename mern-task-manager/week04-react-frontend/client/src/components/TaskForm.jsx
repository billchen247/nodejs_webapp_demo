/**
 * @file src/components/TaskForm.jsx
 * @author Bill Chen
 * @description Controlled form for creating a new task.
 *
 * "Controlled" means React owns the input values via `useState` — the
 * input's `value` prop points at React state, and the `onChange` handler
 * writes back into that state. Submitting trims the title, requires it,
 * fires `onSubmit`, then resets the fields.
 */
import { useState } from "react";
import "./TaskForm.css";

export default function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    onSubmit({ title: trimmedTitle, description: description.trim() });
    setTitle("");
    setDescription("");
    setError("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <h2 className="task-form__heading">New task</h2>

      <div className="task-form__field">
        <label htmlFor="task-title" className="task-form__label">
          Title
        </label>
        <input
          id="task-title"
          className="task-form__input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Something to do…"
          required
          aria-invalid={Boolean(error)}
        />
      </div>

      <div className="task-form__field">
        <label htmlFor="task-description" className="task-form__label">
          Description <span className="task-form__hint">(optional)</span>
        </label>
        <textarea
          id="task-description"
          className="task-form__input task-form__input--textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add context…"
          rows={2}
        />
      </div>

      {error ? (
        <p className="task-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="task-form__actions">
        <button type="submit" className="btn btn--primary">
          Add task
        </button>
      </div>
    </form>
  );
}
