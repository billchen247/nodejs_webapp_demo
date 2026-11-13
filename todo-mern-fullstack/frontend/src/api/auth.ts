import type { LoginInput, RegisterInput, User } from "../types/auth.ts";
import { request } from "./common.ts";
import { removeAuthToken } from "./tokenStorage.ts";

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

    async logout(): Promise<{ message: string }> {
        const result = await request<{ message: string }>("/api/auth/logout", {
            method: "POST",
            body: JSON.stringify({}),
        });
        removeAuthToken();
        return result;
    },
};
