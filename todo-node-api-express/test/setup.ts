import { afterAll, beforeAll, beforeEach } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { createApp } from "../src/app.js";
import { DATA_FILE, writeTodos, type Todo } from "../src/models/todos.js";
import {
    DATA_FILE as STUDENTS_DATA_FILE,
    writeStudents,
    type Student,
} from "../src/models/students.js";
import {
    DATA_FILE as PROJECTS_DATA_FILE,
    writeProjects,
    type Project,
} from "../src/models/projects.js";

export const app = createApp();

const SEED_TODOS: Todo[] = [
    {
        id: 1,
        title: "Learn Node.js",
        completed: false,
        createdAt: "2026-09-23T12:00:00.000Z",
    },
    {
        id: 2,
        title: "Understand Express 5 routing",
        completed: true,
        createdAt: "2026-09-23T12:05:00.000Z",
    },
];

const SEED_STUDENTS: Student[] = [
    {
        id: 1,
        name: "Tom Wu",
        registrationActive: false,
        createdAt: "2026-09-24T12:00:00.000Z",
    },
    {
        id: 2,
        name: "Ada Lovelace",
        registrationActive: true,
        createdAt: "2026-09-24T12:05:00.000Z",
    },
];

const SEED_PROJECTS: Project[] = [
    {
        id: 1,
        name: "Express Learning API",
        description: "Practice building REST resources.",
        createdAt: "2026-09-24T12:00:00.000Z",
    },
    {
        id: 2,
        name: "Todo Dashboard",
        description: "A future client for the todo APIs.",
        createdAt: "2026-09-24T12:05:00.000Z",
    },
];

let originalTodosFile: string | null;
let originalStudentsFile: string | null;
let originalProjectsFile: string | null;

beforeAll(async () => {
    originalTodosFile = await readFileIfPresent(DATA_FILE);
    originalStudentsFile = await readFileIfPresent(STUDENTS_DATA_FILE);
    originalProjectsFile = await readFileIfPresent(PROJECTS_DATA_FILE);
});

afterAll(async () => {
    await restoreFile(DATA_FILE, originalTodosFile);
    await restoreFile(STUDENTS_DATA_FILE, originalStudentsFile);
    await restoreFile(PROJECTS_DATA_FILE, originalProjectsFile);
});

beforeEach(async () => {
    await writeTodos(SEED_TODOS);
    await writeStudents(SEED_STUDENTS);
    await writeProjects(SEED_PROJECTS);
});

async function readFileIfPresent(filePath: string): Promise<string | null> {
    try {
        return await readFile(filePath, "utf8");
    } catch {
        return null;
    }
}

async function restoreFile(filePath: string, contents: string | null): Promise<void> {
    if (contents !== null) await writeFile(filePath, contents, "utf8");
}