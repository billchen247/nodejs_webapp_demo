import type { LoginInput, RegisterInput, User } from "../types/auth";

async function request<T>(path: string, body?: object): Promise<T> {
    const response = await fetch(`/api/${path}`, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const result = await response.json() as { error?: string };
            if (result.error) message = result.error;
        } catch {
            // Keep the HTTP status message when the response is not JSON.
        }
        throw new Error(message);
    }
    return response.json() as Promise<T>;
}

export const authApi = {
    profile(): Promise<{ user: User }> {
        return request("profile");
    },

    register(input: RegisterInput): Promise<{ user: User }> {
        return request("auth/register", input);
    },

    login(input: LoginInput): Promise<{ user: User }> {
        return request("auth/login", input);
    },

    logout(): Promise<{ message: string }> {
        return request("auth/logout", {});
    },
};
