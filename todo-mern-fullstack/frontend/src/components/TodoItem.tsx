/* =============================================================================
 * src/components/TodoItem.tsx — one row in the todo list
 * =============================================================================
 *
 * A single todo renders:
 *   • a checkbox   (toggle complete / not-complete)
 *   • the title    (click to rename inline)
 *   • a delete button
 *
 * All mutations are delegated to the parent via callbacks — this component
 * is **presentational** and knows nothing about the backend.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { useState, type KeyboardEvent } from "react";
import type { Todo } from "../types/todo";

interface Props {
    todo: Todo;
    onToggle: (todo: Todo) => void;
    onRename: (todo: Todo, newTitle: string) => void;
    onRemove: (todo: Todo) => void;
}

export function TodoItem({ todo, onToggle, onRename, onRemove }: Props) {
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<string>(todo.title);

    function commitRename(): void {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== todo.title) {
            onRename(todo, trimmed);
        } else {
            // User cleared the input or didn't change anything — snap back.
            setDraft(todo.title);
        }
        setEditing(false);
    }

    function handleKey(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key === "Enter") commitRename();
        if (event.key === "Escape") {
            setDraft(todo.title);
            setEditing(false);
        }
    }

    return (
        <li className={`todo-item ${todo.completed ? "is-done" : ""}`}>
            <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => onToggle(todo)}
                aria-label={`Mark "${todo.title}" ${todo.completed ? "as not done" : "as done"}`}
            />

            {editing ? (
                <input
                    className="todo-item__edit"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleKey}
                    maxLength={200}
                />
            ) : (
                <span
                    className="todo-item__title"
                    onDoubleClick={() => setEditing(true)}
                    title="Double-click to rename"
                >
                    {todo.title}
                </span>
            )}

            <button
                className="todo-item__delete"
                type="button"
                onClick={() => onRemove(todo)}
                aria-label={`Delete "${todo.title}"`}
            >
                ×
            </button>
        </li>
    );
}
