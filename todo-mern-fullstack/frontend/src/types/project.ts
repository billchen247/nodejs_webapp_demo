export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
}

export interface UpdateProjectInput {
    name?: string;
    description?: string;
}
