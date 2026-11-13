import type {
    CreateProjectInput,
    Project,
    UpdateProjectInput,
} from "../types/project.ts";
import { request } from "./common.ts";

const BASE_URL = "/api/projects";

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
