import { describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "./setup.js";

describe("home page", () => {
    test("GET / serves the HTML home page", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/html/);
        expect(res.text).toMatch(/<title>Todo Express API<\/title>/);
        expect(res.text).toMatch(/\/api\/todos/);
    });
});