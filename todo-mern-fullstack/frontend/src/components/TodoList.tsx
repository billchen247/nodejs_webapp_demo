/* =============================================================================
 * src/components/TodoList.tsx — renders the collection of todos
 * =============================================================================
 *
 * A dumb-ish component: given an array + callbacks, map each todo to a
 * `<TodoItem>`. Also renders empty-state and loading placeholders so the
 * UI never looks "broken" while data is in flight.
 *
 * Important: give each `<TodoItem>` a stable `key={todo.id}`. React uses
 * that key to decide which DOM nodes to keep across renders — without it
 * you get flickering and lost focus.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import type { Todo } from "../types/todo";
import { TodoItem } from "./TodoItem";

interface Props {
    todos: Todo[];
    loading: boolean;
    onToggle: (todo: Todo) => void;
    onRename: (todo: Todo, newTitle: string) => void;
    onRemove: (todo: Todo) => void;
}

export function TodoList({
    todos,
    loading,
    onToggle,
    onRename,
    onRemove,
}: Props) {
    if (loading) {
        return <p className="todo-empty">Loading…</p>;
    }

    if (todos.length === 0) {
        return (
            <p className="todo-empty">
                Nothing here yet — add your first todo above!
            </p>
        );
    }

    return (
        <ul className="todo-list">
            {todos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onRename={onRename}
                    onRemove={onRemove}
                />
            ))}
        </ul>
    );
}
