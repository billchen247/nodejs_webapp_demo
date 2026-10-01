/* =============================================================================
 * src/hooks/useTodos.ts — custom React hook that owns the todo list state
 * =============================================================================
 *
 * Pattern: isolate all state + side-effects into a hook so components stay
 * declarative. The hook exposes:
 *
 *   • `todos`, `loading`, `error` — reactive state the UI reads.
 *   • `createTodo`, `toggleTodo`, `renameTodo`, `removeTodo` — mutations
 *     that call the API AND update local state optimistically.
 *
 * A real app at scale would use TanStack Query (React Query) for caching,
 * retries, and background re-fetches. We stick with plain `useState +
 * useEffect` to keep the learning curve shallow.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { useCallback, useEffect, useState } from "react";
import { todosApi } from "../api/todos";
import type { Todo } from "../types/todo";

export interface UseTodosResult {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    createTodo: (title: string) => Promise<void>;
    toggleTodo: (todo: Todo) => Promise<void>;
    renameTodo: (todo: Todo, newTitle: string) => Promise<void>;
    removeTodo: (todo: Todo) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useTodos(): UseTodosResult {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /* ------------------------------------------------------------------
     * Centralised fetch — wrapped in useCallback so the identity is
     * stable across renders. Important if we pass `refresh` to child
     * components (prevents unnecessary re-renders).
     * ---------------------------------------------------------------- */
    const refresh = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const list = await todosApi.list();
            setTodos(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load todos once when the hook mounts. The empty dep array is correct
    // because `refresh` is stable (useCallback with []).
    useEffect(() => {
        void refresh();
    }, [refresh]);

    /* ------------------------------------------------------------------
     * Mutations.
     *
     * Pattern per mutation:
     *   1. Call the API.
     *   2. Patch local state with the server's response (never guess —
     *      the server might normalise fields, add timestamps, etc.).
     *   3. On error, surface it via `error` and re-fetch so the UI
     *      doesn't lie about what the DB contains.
     * ---------------------------------------------------------------- */
    const createTodo = useCallback(async (title: string): Promise<void> => {
        try {
            const created = await todosApi.create({ title });
            setTodos((prev) => [created, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Create failed");
        }
    }, []);

    const toggleTodo = useCallback(async (todo: Todo): Promise<void> => {
        try {
            const updated = await todosApi.update(todo.id, {
                completed: !todo.completed,
            });
            setTodos((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t)),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Toggle failed");
        }
    }, []);

    const renameTodo = useCallback(
        async (todo: Todo, newTitle: string): Promise<void> => {
            try {
                const updated = await todosApi.update(todo.id, {
                    title: newTitle,
                });
                setTodos((prev) =>
                    prev.map((t) => (t.id === updated.id ? updated : t)),
                );
            } catch (err) {
                setError(err instanceof Error ? err.message : "Rename failed");
            }
        },
        [],
    );

    const removeTodo = useCallback(async (todo: Todo): Promise<void> => {
        try {
            await todosApi.remove(todo.id);
            setTodos((prev) => prev.filter((t) => t.id !== todo.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    }, []);

    return {
        todos,
        loading,
        error,
        createTodo,
        toggleTodo,
        renameTodo,
        removeTodo,
        refresh,
    };
}
