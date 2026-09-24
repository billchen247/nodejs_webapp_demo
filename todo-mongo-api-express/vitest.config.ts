/* @author Bill Chen */
import { defineConfig } from "vitest/config";

/* ---------------------------------------------------------------------------
 * vitest.config.ts
 *
 * Vitest is a Vite-native test runner. We use it instead of Jest because:
 *   - Native ESM + TypeScript, no ts-jest / babel-jest setup.
 *   - Familiar Jest-compatible API (describe/it/expect).
 *   - Fast: parallelised, in-process.
 *
 * MongoDB test isolation
 * ----------------------
 * The suite spins up a single `mongodb-memory-server` inside `beforeAll` and
 * clears every collection between tests. We keep the whole file in one worker
 * (singleFork) so the in-memory server doesn't get booted N times.
 * -------------------------------------------------------------------------*/

export default defineConfig({
    test: {
        include: ["test/**/*.test.ts"],
        environment: "node",
        env: { NODE_ENV: "test" },
        // The in-memory MongoDB server can take a few seconds to download the
        // binary on the first run.
        testTimeout: 60_000,
        hookTimeout: 60_000,
        pool: "forks",
        poolOptions: { forks: { singleFork: true } },
        reporters: ["default"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/**"],
            exclude: ["src/server.ts"],
        },
    },
});
