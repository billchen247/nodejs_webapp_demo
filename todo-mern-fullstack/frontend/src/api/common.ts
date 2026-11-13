/**
 * Shared fetch wrapper for API requests. Non-2xx responses become Errors
 * with the server message when available.
 */
import { getAuthToken, setAuthToken } from "./tokenStorage.ts";

export async function request<T>(
    url: string,
    init: RequestInit = {},
): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const token = getAuthToken();
    if (token) {
        headers.set("X-Auth-Token", token);
    }

    const response = await fetch(url, {
        ...init,
        headers,
        credentials: "include",
    });

    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const body = (await response.json()) as { error?: string };
            if (body.error) message = body.error;
        } catch {
            // Fall back to the HTTP status when the response is not JSON.
        }
        throw new Error(message);
    }

    const responseToken = response.headers.get("X-Auth-Token");
    if (responseToken !== null) {
        setAuthToken(responseToken);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}
