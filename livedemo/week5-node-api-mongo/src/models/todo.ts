import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

const todoSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export type Todo = InferSchemaType<typeof todoSchema>;

const TodoModel = model<Todo>("Todo", todoSchema);

export default TodoModel;
