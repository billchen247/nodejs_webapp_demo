import { useCallback, useEffect, useState } from "react";
import { projectsApi } from "../api/projects";
import type { Project, UpdateProjectInput } from "../types/project";

export interface UseProjectsResult {
    projects: Project[];
    loading: boolean;
    error: string | null;
    createProject: (name: string, description: string) => Promise<boolean>;
    updateProject: (project: Project, patch: UpdateProjectInput) => Promise<boolean>;
    removeProject: (project: Project) => Promise<boolean>;
}

export function useProjects(): UseProjectsResult {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            setProjects(await projectsApi.list());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load projects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const createProject = useCallback(
        async (name: string, description: string): Promise<boolean> => {
            try {
                const created = await projectsApi.create({ name, description });
                setProjects((current) => [created, ...current]);
                setError(null);
                return true;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to create project.");
                return false;
            }
        },
        [],
    );

    const updateProject = useCallback(
        async (project: Project, patch: UpdateProjectInput): Promise<boolean> => {
            try {
                const updated = await projectsApi.update(project.id, patch);
                setProjects((current) =>
                    current.map((item) => item.id === updated.id ? updated : item),
                );
                setError(null);
                return true;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to update project.");
                return false;
            }
        },
        [],
    );

    const removeProject = useCallback(async (project: Project): Promise<boolean> => {
        try {
            await projectsApi.remove(project.id);
            setProjects((current) => current.filter((item) => item.id !== project.id));
            setError(null);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete project.");
            return false;
        }
    }, []);

    return { projects, loading, error, createProject, updateProject, removeProject };
}
