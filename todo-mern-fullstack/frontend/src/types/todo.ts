/* =============================================================================
 * src/types/todo.ts — shared TS types for the todo resource
 * =============================================================================
 *
 * Having a central `Todo` type means every component, hook, and API caller
 * agrees on the shape of a todo. If the backend's response ever changes,
 * TypeScript will complain in every consumer at once.
 *
 * In a bigger project you'd generate these types from the OpenAPI spec on
 * the backend; for this teaching project we keep them hand-written.
 *
 * @author Bill Chen
 * ===========================================================================
 */

export interface Todo {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Payload accepted by POST /api/todos. */
export interface CreateTodoInput {
    title: string;
    completed?: boolean;
}

/** Payload accepted by PATCH /api/todos/:id. Both fields optional. */
export interface UpdateTodoInput {
    title?: string;
    completed?: boolean;
}
