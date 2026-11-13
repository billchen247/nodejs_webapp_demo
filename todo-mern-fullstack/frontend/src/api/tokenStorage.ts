const AUTH_TOKEN_STORAGE_KEY = "todo-mern-fullstack:auth-token";

export function getAuthToken(): string | null {
    return globalThis.window?.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function setAuthToken(token: string): void {
    globalThis.window?.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function removeAuthToken(): void {
    globalThis.window?.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
