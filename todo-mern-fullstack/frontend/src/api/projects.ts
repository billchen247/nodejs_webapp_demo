import type {
    CreateProjectInput,
    Project,
    UpdateProjectInput,
} from "../types/project";

const BASE_URL = "/api/projects";

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...init,
    });

    if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
            const body = (await res.json()) as { error?: string };
            if (body.error) message = body.error;
        } catch {
            // Fall back to the HTTP status when the response is not JSON.
        }
        throw new Error(message);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

export const projectsApi = {
    list(): Promise<Project[]> {
        return request<Project[]>(BASE_URL);
    },

    get(id: string): Promise<Project> {
        return request<Project>(`${BASE_URL}/${id}`);
    },

    create(input: CreateProjectInput): Promise<Project> {
        return request<Project>(BASE_URL, {
            method: "POST",
            body: JSON.stringify(input),
        });
    },

    update(id: string, patch: UpdateProjectInput): Promise<Project> {
        return request<Project>(`${BASE_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        });
    },

    remove(id: string): Promise<void> {
        return request<void>(`${BASE_URL}/${id}`, { method: "DELETE" });
    },
};
