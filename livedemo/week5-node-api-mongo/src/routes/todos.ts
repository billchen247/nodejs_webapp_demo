import express from "express";

import * as todosController from "../controllers/todos.js";

const router = express.Router();

router
  .route("/")
  .get(todosController.listTodos)
  .post(todosController.createTodo);

router
  .route("/:id")
  .get(todosController.getTodo)
  .put(todosController.replaceTodo)
  .patch(todosController.updateTodo)
  .delete(todosController.deleteTodo);

export default router;
