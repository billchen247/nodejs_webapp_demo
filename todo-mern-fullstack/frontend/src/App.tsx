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

import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { authApi } from "./api/auth";
import { AuthForm } from "./components/AuthForm";
import { useTodos } from "./hooks/useTodos";
import { TodoForm } from "./components/TodoForm";
import { TodoList } from "./components/TodoList";
import type { User } from "./types/auth";

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        void authApi.profile()
            .then(({ user: profile }) => {
                if (active) setUser(profile);
            })
            .catch((err: unknown) => {
                if (active && err instanceof Error && err.message !== "Authentication required.") {
                    setAuthError(err.message);
                }
            })
            .finally(() => {
                if (active) setAuthLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    if (authLoading) {
        return <main className="app"><p role="status">Checking your session…</p></main>;
    }

    if (!user) {
        return (
            <main className="app">
                <header className="app__header">
                    <h1>Todo — MERN Fullstack</h1>
                    <p className="app__subtitle">Sign in or register to manage your todos.</p>
                </header>
                {authError && <div role="alert" className="app__error">{authError}</div>}
                <AuthForm onAuthenticated={(authenticatedUser) => {
                    setAuthError(null);
                    setUser(authenticatedUser);
                }} />
            </main>
        );
    }

    return <AuthenticatedApp user={user} onLogout={() => {
        setUser(null);
    }} />;
}

function AuthenticatedApp({ user, onLogout }: { user: User; onLogout: () => void }) {
    const [authActionError, setAuthActionError] = useState<string | null>(null);
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

    async function logout(): Promise<void> {
        try {
            await authApi.logout();
            setAuthActionError(null);
            onLogout();
        } catch (err) {
            setAuthActionError(err instanceof Error ? err.message : "Unable to sign out.");
        }
    }

    return (
        <main className="app">
            <header className="app__header">
                <h1>Todo — MERN Fullstack</h1>
                <p className="app__subtitle">
                    React 19 · Vite · TypeScript · Express 5 · MongoDB
                </p>
                <div className="profile-bar">
                    <span>Signed in as <strong>{user.name}</strong> ({user.role})</span>
                    <button type="button" onClick={() => void logout()}>Sign out</button>
                </div>
            </header>

            {authActionError && (
                <div role="alert" className="app__error">{authActionError}</div>
            )}

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
