/**
 * @file src/services/userService.js
 * @author Bill Chen
 * @description Admin-only user API client. The server also enforces admin role.
 */
import { request } from "./taskService.js";

export const userService = {
  list() {
    return request("/api/users");
  },
  get(id) {
    return request(`/api/users/${id}`);
  },
};
