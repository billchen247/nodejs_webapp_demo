import { useState, type FormEvent } from "react";

interface LocalTodo {
    id: string;
    title: string;
    completed: boolean;
}

interface StoredTodos {
    todos: LocalTodo[];
    error: string | null;
}

interface Props {
    userId: string;
}

function isLocalTodo(todo: unknown): todo is LocalTodo {
    return (
        typeof todo === "object" &&
        todo !== null &&
        "id" in todo &&
        typeof todo.id === "string" &&
        "title" in todo &&
        typeof todo.title === "string" &&
        "completed" in todo &&
        typeof todo.completed === "boolean"
    );
}

function readLocalTodos(storageKey: string): StoredTodos {
    try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored === null) {
            return { todos: [], error: null };
        }

        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            throw new Error("Saved local todos have an invalid format.");
        }

        const todos = parsed.filter(isLocalTodo);
        if (todos.length !== parsed.length) {
            throw new Error("Saved local todos have an invalid format.");
        }

        return { todos, error: null };
    } catch (err) {
        return {
            todos: [],
            error: err instanceof Error ? err.message : "Unable to read local todos.",
        };
    }
}

export function LocalStorageDemo({ userId }: Props) {
    const storageKey = `todo-local-demo:${userId}`;
    const [storedTodos, setStoredTodos] = useState<StoredTodos>(
        () => readLocalTodos(storageKey),
    );
    const [title, setTitle] = useState("");

    function saveTodos(nextTodos: LocalTodo[]): void {
        setStoredTodos({ todos: nextTodos, error: null });
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(nextTodos));
        } catch (err) {
            setStoredTodos({
                todos: nextTodos,
                error: err instanceof Error ? err.message : "Unable to save local todos.",
            });
        }
    }

    function addTodo(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;

        saveTodos([
            { id: crypto.randomUUID(), title: trimmed, completed: false },
            ...storedTodos.todos,
        ]);
        setTitle("");
    }

    function resetTodos(): void {
        setStoredTodos({ todos: [], error: null });
        try {
            window.localStorage.removeItem(storageKey);
        } catch (err) {
            setStoredTodos({
                todos: [],
                error: err instanceof Error ? err.message : "Unable to clear local todos.",
            });
        }
    }

    return (
        <section className="local-storage-demo" aria-labelledby="local-storage-heading">
            <header className="local-storage-demo__header">
                <div>
                    <h2 id="local-storage-heading">LocalStorage demo</h2>
                    <p className="local-storage-demo__description">
                        These sample todos are saved in this browser only, not sent to the server.
                        Refresh the page to see them persist.
                    </p>
                </div>
                <button className="local-storage-demo__reset" type="button" onClick={resetTodos}>
                    Reset demo
                </button>
            </header>

            {storedTodos.error && (
                <div role="alert" className="app__error">
                    Could not access saved demo data: {storedTodos.error}
                </div>
            )}

            <form className="todo-form" onSubmit={addTodo}>
                <input
                    type="text"
                    placeholder="Try a local-only todo"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={200}
                    aria-label="New local todo"
                />
                <button type="submit" disabled={!title.trim()}>
                    Add locally
                </button>
            </form>

            {storedTodos.todos.length === 0 ? (
                <p className="todo-empty">No local todos yet — add one to try it out.</p>
            ) : (
                <ul className="todo-list">
                    {storedTodos.todos.map((todo) => (
                        <li
                            className={`todo-item ${todo.completed ? "is-done" : ""}`}
                            key={todo.id}
                        >
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() =>
                                    saveTodos(
                                        storedTodos.todos.map((item) =>
                                            item.id === todo.id
                                                ? { ...item, completed: !item.completed }
                                                : item,
                                        ),
                                    )
                                }
                                aria-label={`Mark "${todo.title}" ${
                                    todo.completed ? "as not done" : "as done"
                                }`}
                            />
                            <span className="todo-item__title">{todo.title}</span>
                            <button
                                className="todo-item__delete"
                                type="button"
                                onClick={() =>
                                    saveTodos(
                                        storedTodos.todos.filter((item) => item.id !== todo.id),
                                    )
                                }
                                aria-label={`Delete "${todo.title}"`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
