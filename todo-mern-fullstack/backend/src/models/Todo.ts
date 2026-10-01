/* =============================================================================
 * src/models/Todo.ts — Mongoose schema and model for a Todo document
 * =============================================================================
 *
 * In Mongoose there are three concepts that often confuse beginners:
 *
 *   1. **Schema** — the shape definition. Fields, types, validation rules,
 *      indexes, hooks.
 *   2. **Model** — a constructor compiled from a schema. Use the model to
 *      actually read / write documents in the DB.
 *      e.g. `Todo.create(...)`, `Todo.find(...)`.
 *   3. **Document** — an instance returned by the model. Has `.save()`,
 *      `.remove()`, virtuals, etc.
 *
 * We also define a TypeScript interface (`TodoDoc`) so TS knows the shape
 * of documents returned from `Todo.find()`.
 *
 * @author Bill Chen
 * ===========================================================================
 */

import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/* ---------------------------------------------------------------------------
 * 1. Describe the schema.
 *    `required: true` + default values keep the data clean at write-time.
 * ------------------------------------------------------------------------- */
const todoSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "A todo must have a title."],
            trim: true,         // strip leading / trailing whitespace
            minlength: 1,
            maxlength: 200,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        // Mongo auto-adds `createdAt` and `updatedAt` with this option.
        timestamps: true,

        // When a document is serialized to JSON (e.g. res.json(todo)), run
        // this transform: replace Mongo's `_id` ObjectId with a plain string
        // `id`, and drop the `__v` version key. Frontend code sees a tidy
        // JSON object without any Mongo-specific detail leaking out.
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform(_doc, ret: Record<string, unknown>) {
                ret.id = String(ret._id);
                delete ret._id;
            },
        },
    },
);

/* ---------------------------------------------------------------------------
 * 2. Derive the TS type from the schema itself — the single source of truth.
 *    If you add a field to the schema, the type updates automatically.
 * ------------------------------------------------------------------------- */
export type Todo = InferSchemaType<typeof todoSchema>;
export type TodoDoc = HydratedDocument<Todo>;

/* ---------------------------------------------------------------------------
 * 3. Compile the model. "Todo" becomes the Mongo collection "todos"
 *    (Mongoose lowercases + pluralises automatically).
 * ------------------------------------------------------------------------- */
export const TodoModel = model<Todo>("Todo", todoSchema);
