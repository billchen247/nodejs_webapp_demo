/**
 * @file src/validators/authValidators.js
 * @author Bill Chen
 * @description Request-shape validators for auth routes.
 */

import { body } from "express-validator";

export const registerValidators = [
  body("name").isString().trim().isLength({ min: 1, max: 80 })
    .withMessage("name is 1–80 characters"),
  body("email").isString().trim().toLowerCase().isEmail()
    .withMessage("valid email required"),
  body("password").isString().isLength({ min: 8, max: 128 })
    .withMessage("password must be 8–128 characters"),
];

export const loginValidators = [
  body("email").isString().trim().toLowerCase().isEmail()
    .withMessage("valid email required"),
  body("password").isString().isLength({ min: 1, max: 128 })
    .withMessage("password required"),
];

export const forgotPasswordValidators = [
  body("email").isString().trim().toLowerCase().isEmail()
    .withMessage("valid email required"),
];

export const resetPasswordValidators = [
  body("token").isString().isLength({ min: 32, max: 128 })
    .withMessage("token is required"),
  body("password").isString().isLength({ min: 8, max: 128 })
    .withMessage("password must be 8–128 characters"),
];
