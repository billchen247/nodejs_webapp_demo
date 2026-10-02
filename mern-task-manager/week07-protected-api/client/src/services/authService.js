/**
 * @file src/services/authService.js
 * @author Bill Chen
 * @description Auth service — register / login / logout / me.
 *   All calls go through the shared `request()` helper, which sends cookies
 *   automatically with `credentials: "include"`.
 */

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
};
