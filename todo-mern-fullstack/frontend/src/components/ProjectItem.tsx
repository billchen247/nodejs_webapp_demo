import { useState, type FormEvent } from "react";
import type { Project, UpdateProjectInput } from "../types/project";

interface Props {
    project: Project;
    onUpdate: (project: Project, patch: UpdateProjectInput) => Promise<boolean>;
    onRemove: (project: Project) => Promise<boolean>;
}

export function ProjectItem({ project, onUpdate, onRemove }: Props) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setSaving(true);
        try {
            if (await onUpdate(project, { name: trimmedName, description: description.trim() })) {
                setEditing(false);
            }
        } finally {
            setSaving(false);
        }
    }

    function cancelEdit(): void {
        setName(project.name);
        setDescription(project.description);
        setEditing(false);
    }

    function handleRemove(): void {
        if (window.confirm(`Delete "${project.name}"? This action cannot be undone.`)) {
            void onRemove(project);
        }
    }

    return (
        <li className="project-item">
            {editing ? (
                <form className="project-item__edit" onSubmit={handleSubmit}>
                    <label>
                        Project name
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={120}
                            required
                            disabled={saving}
                        />
                    </label>
                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={1000}
                            rows={2}
                            disabled={saving}
                        />
                    </label>
                    <div className="project-item__actions">
                        <button type="submit" disabled={saving || !name.trim()}>Save</button>
                        <button type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="project-item__content">
                        <h3>{project.name}</h3>
                        {project.description && <p>{project.description}</p>}
                    </div>
                    <div className="project-item__actions">
                        <button type="button" onClick={() => setEditing(true)}>
                            Edit
                        </button>
                        <button
                            className="project-item__delete"
                            type="button"
                            onClick={handleRemove}
                            aria-label={`Delete ${project.name}`}
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
        </li>
    );
}
