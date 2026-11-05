import type { Project, UpdateProjectInput } from "../types/project";
import { ProjectItem } from "./ProjectItem";

interface Props {
    projects: Project[];
    loading: boolean;
    onUpdate: (project: Project, patch: UpdateProjectInput) => Promise<boolean>;
    onRemove: (project: Project) => Promise<boolean>;
}

export function ProjectList({ projects, loading, onUpdate, onRemove }: Props) {
    if (loading) {
        return <p className="todo-empty" role="status">Loading projects…</p>;
    }

    if (projects.length === 0) {
        return <p className="todo-empty">No projects yet — create your first project above.</p>;
    }

    return (
        <ul className="project-list">
            {projects.map((project) => (
                <ProjectItem
                    key={project.id}
                    project={project}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                />
            ))}
        </ul>
    );
}
