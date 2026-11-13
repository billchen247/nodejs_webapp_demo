const AUTH_TOKEN_STORAGE_KEY = "todo-mern-fullstack:auth-token";

export function getAuthToken(): string | null {
    return globalThis.window?.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
}

export function setAuthToken(token: string): void {
    globalThis.window?.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function removeAuthToken(): void {
    globalThis.window?.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
