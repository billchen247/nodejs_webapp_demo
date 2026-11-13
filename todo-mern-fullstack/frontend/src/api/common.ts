/**
 * Shared fetch wrapper for API requests. Non-2xx responses become Errors
 * with the server message when available.
 */
export async function request<T>(
    url: string,
    init: RequestInit = {},
): Promise<T> {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...init,
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

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
}
