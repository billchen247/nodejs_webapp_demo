/* =============================================================================
 * src/App.tsx — top-level React component
 * =============================================================================
 *
 * This is the "page" of the SPA. It:
 *   1. Pulls todo state + mutations from the `useTodos` hook.
 *   2. Lays out the UI (header, form, list, footer stats).
 *   3. Renders an error banner if something went wrong.
 *
 * Keeping App.tsx small and declarative — no fetch calls, no setState
 * littered around — is the whole point of extracting state into a hook.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { useMemo } from "react";
import "./App.css";

import { useTodos } from "./hooks/useTodos";
import { TodoForm } from "./components/TodoForm";
import { TodoList } from "./components/TodoList";

export default function App() {
    const {
        todos,
        loading,
        error,
        createTodo,
        toggleTodo,
        renameTodo,
        removeTodo,
    } = useTodos();

    // Derived state — recomputed only when `todos` changes. `useMemo` is
    // overkill for a cheap filter like this, but it demonstrates the hook.
    const remainingCount = useMemo(
        () => todos.filter((t) => !t.completed).length,
        [todos],
    );

    return (
        <main className="app">
            <header className="app__header">
                <h1>Todo — MERN Fullstack</h1>
                <p className="app__subtitle">
                    React 19 · Vite · TypeScript · Express 5 · MongoDB
                </p>
            </header>

            <TodoForm onCreate={createTodo} />

            {error && (
                <div role="alert" className="app__error">
                    {error}
                </div>
            )}

            <TodoList
                todos={todos}
                loading={loading}
                onToggle={toggleTodo}
                onRename={renameTodo}
                onRemove={removeTodo}
            />

            <footer className="app__footer">
                <span>
                    {remainingCount} of {todos.length} remaining
                </span>
                <span className="app__hint">
                    Double-click a todo to rename it.
                </span>
            </footer>
        </main>
    );
}
