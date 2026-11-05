import { useMemo, useState } from "react";
import { authApi } from "../api/auth";
import { TodoForm } from "./TodoForm";
import { TodoList } from "./TodoList";
import { NavigationBar } from "./NavigationBar";
import { useTodos } from "../hooks/useTodos";
import type { User } from "../types/auth";

interface Props {
    user: User;
    onLogout: () => void;
}

export function AuthenticatedApp({ user, onLogout }: Props) {
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

    const remainingCount = useMemo(
        () => todos.filter((todo) => !todo.completed).length,
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
        <>
            <NavigationBar mode="authenticated" user={user} onLogout={() => void logout()} />
            <main className="app" id="todos">
                <header className="app__header">
                    <h1>My todos</h1>
                    <p className="app__subtitle">
                        React 19 · Vite · TypeScript · Express 5 · MongoDB
                    </p>
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
                    <span>{remainingCount} of {todos.length} remaining</span>
                    <span className="app__hint">Double-click a todo to rename it.</span>
                </footer>
            </main>
        </>
    );
}
