import type { LoginInput, RegisterInput, User } from "../types/auth";
import { request } from "./common";

export const authApi = {
    profile(): Promise<{ user: User }> {
        return request("/api/profile");
    },

    register(input: RegisterInput): Promise<{ user: User }> {
        return request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },

    login(input: LoginInput): Promise<{ user: User }> {
        return request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },

    logout(): Promise<{ message: string }> {
        return request("/api/auth/logout", {
            method: "POST",
            body: JSON.stringify({}),
        });
    },
};
