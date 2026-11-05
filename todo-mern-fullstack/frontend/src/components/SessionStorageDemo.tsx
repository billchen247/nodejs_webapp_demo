import { useState, type FormEvent } from "react";

interface SessionTodo {
    id: string;
    title: string;
    completed: boolean;
}

interface StoredTodos {
    todos: SessionTodo[];
    error: string | null;
}

interface Props {
    userId: string;
}

function isSessionTodo(todo: unknown): todo is SessionTodo {
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

function readSessionTodos(storageKey: string): StoredTodos {
    try {
        const stored = window.sessionStorage.getItem(storageKey);
        if (stored === null) {
            return { todos: [], error: null };
        }

        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            throw new Error("Saved session todos have an invalid format.");
        }

        const todos = parsed.filter(isSessionTodo);
        if (todos.length !== parsed.length) {
            throw new Error("Saved session todos have an invalid format.");
        }

        return { todos, error: null };
    } catch (err) {
        return {
            todos: [],
            error: err instanceof Error ? err.message : "Unable to read session todos.",
        };
    }
}

export function SessionStorageDemo({ userId }: Props) {
    const storageKey = `todo-session-demo:${userId}`;
    const [storedTodos, setStoredTodos] = useState<StoredTodos>(
        () => readSessionTodos(storageKey),
    );
    const [title, setTitle] = useState("");

    function saveTodos(nextTodos: SessionTodo[]): void {
        setStoredTodos({ todos: nextTodos, error: null });
        try {
            window.sessionStorage.setItem(storageKey, JSON.stringify(nextTodos));
        } catch (err) {
            setStoredTodos({
                todos: nextTodos,
                error: err instanceof Error ? err.message : "Unable to save session todos.",
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
            window.sessionStorage.removeItem(storageKey);
        } catch (err) {
            setStoredTodos({
                todos: [],
                error: err instanceof Error ? err.message : "Unable to clear session todos.",
            });
        }
    }

    return (
        <section className="session-storage-demo" aria-labelledby="session-storage-heading">
            <header className="local-storage-demo__header">
                <div>
                    <h2 id="session-storage-heading">SessionStorage demo</h2>
                    <p className="local-storage-demo__description">
                        These sample todos survive refreshes in this tab, but are cleared when
                        its browsing session ends. They are not sent to the server.
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
                    placeholder="Try a tab-only todo"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={200}
                    aria-label="New session todo"
                />
                <button type="submit" disabled={!title.trim()}>
                    Add for this tab
                </button>
            </form>

            {storedTodos.todos.length === 0 ? (
                <p className="todo-empty">No session todos yet — add one to try it out.</p>
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
