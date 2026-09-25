import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_FILE: string = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "projects.json"
);

export interface Project {
    id: number;
    name: string;
    description: string;
    createdAt: string;
}

export async function readProjects(): Promise<Project[]> {
    try {
        const raw = await readFile(DATA_FILE, "utf8");
        if (raw.trim() === "") return [];
        return JSON.parse(raw) as Project[];
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw err;
    }
}

export async function writeProjects(projects: Project[]): Promise<void> {
    await writeFile(DATA_FILE, JSON.stringify(projects, null, 2), "utf8");
}