/**
 * @file src/validators/taskValidators.js
 * @author Bill Chen
 * @description Request-shape validators for task routes.
 */

import { body, param } from "express-validator";
import mongoose from "mongoose";

const idRule = param("id").custom((v) => mongoose.isValidObjectId(v))
  .withMessage("invalid task id");

export const createTaskValidators = [
  body("title").isString().trim().isLength({ min: 1, max: 200 })
    .withMessage("title is 1–200 characters"),
  body("description").optional().isString().isLength({ max: 2000 })
    .withMessage("description is at most 2000 characters"),
  body("completed").optional().isBoolean().withMessage("completed must be boolean"),
];

export const updateTaskValidators = [
  idRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 200 })
    .withMessage("title is 1–200 characters"),
  body("description").optional().isString().isLength({ max: 2000 })
    .withMessage("description is at most 2000 characters"),
  body("completed").optional().isBoolean().withMessage("completed must be boolean"),
];

export const idOnlyValidators = [idRule];
