/* =============================================================================
 * src/components/TodoForm.tsx — input + submit for new todos
 * =============================================================================
 *
 * Controlled form, the React way:
 *   • `useState` holds the current value of the input.
 *   • `onChange` keeps React's state in sync with the DOM.
 *   • `onSubmit` calls the parent's `onCreate` handler then clears input.
 *
 * We never let the browser do its default form submit — that would reload
 * the page and nuke our SPA state.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { useState, type FormEvent } from "react";

interface Props {
    onCreate: (title: string) => Promise<void> | void;
}

export function TodoForm({ onCreate }: Props) {
    const [title, setTitle] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();              // stop full-page reload
        const trimmed = title.trim();
        if (!trimmed) return;                // don't send empty todos

        setSubmitting(true);
        try {
            await onCreate(trimmed);
            setTitle("");                    // clear only on success
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="todo-form" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="What needs doing?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                aria-label="New todo title"
                disabled={submitting}
            />
            <button type="submit" disabled={submitting || title.trim() === ""}>
                {submitting ? "Adding…" : "Add"}
            </button>
        </form>
    );
}
