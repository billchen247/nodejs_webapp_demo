/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: client/src/components/TaskForm.tsx
 *
 * Controlled form.
 *
 * Why "controlled"?
 *   The input's value lives in React state. React is always the source of
 *   truth, so we can validate before submit, clear the field after submit,
 *   and show error messages — all without reaching into the DOM.
 */
import { useState, type FormEvent } from "react";
import "./TaskForm.css";

interface TaskFormProps {
  onAdd: (title: string, description: string) => void;
}

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    // Default form submission reloads the page. In a SPA that is almost
    // never what we want, so we stop it on every single React form.
    event.preventDefault();

    const trimmed = title.trim();
    if (trimmed === "") {
      setError("Title cannot be empty");
      return;
    }

    onAdd(trimmed, description.trim());
    setTitle("");
    setDescription("");
    setError(null);
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="task-form__row">
        <label htmlFor="task-title" className="task-form__label">
          Title
        </label>
        <input
          id="task-title"
          className="task-form__input"
          type="text"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? "task-title-error" : undefined}
          autoFocus
        />
      </div>

      <div className="task-form__row">
        <label htmlFor="task-description" className="task-form__label">
          Description (optional)
        </label>
        <textarea
          id="task-description"
          className="task-form__textarea"
          placeholder="Add any extra context"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {error && (
        <div
          id="task-title-error"
          className="task-form__error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="task-form__actions">
        <button type="submit" className="task-form__submit">
          Add task
        </button>
      </div>
    </form>
  );
}
