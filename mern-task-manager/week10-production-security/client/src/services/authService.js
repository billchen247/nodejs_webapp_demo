/**
 * @file src/services/authService.js
 * @author Bill Chen
 * @description Fetch wrappers for the auth API — register, login, logout,
 *   session check (me), and the forgot/reset password flow.
 */
// Auth service — register / login / logout / me + forgot/reset password.

import { request } from "./taskService.js";

export const authService = {
  register(input) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  login(input) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  logout() {
    return request("/api/auth/logout", { method: "POST" });
  },
  me() {
    return request("/api/auth/me");
  },
  forgotPassword(email) {
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(token, password) {
    return request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
};
