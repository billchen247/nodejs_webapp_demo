/* @author Bill Chen */
import { defineConfig } from "vitest/config";

/* ---------------------------------------------------------------------------
 * vitest.config.ts
 *
 * Vitest is a Vite-native test runner. We use it instead of Jest because:
 *   - Native ESM + TypeScript, no ts-jest / babel-jest setup.
 *   - Familiar Jest-compatible API (describe/it/expect).
 *   - Fast: parallelised, in-process.
 * -------------------------------------------------------------------------*/

export default defineConfig({
    test: {
        // Only pick up files under test/. Keeps vitest from stumbling into
        // src/ or dist/ during watch mode.
        include: ["test/**/*.test.ts"],
        // Make process.env.NODE_ENV=test the default so morgan + rate-limit
        // are silenced during tests (see src/app.ts).
        environment: "node",
        env: { NODE_ENV: "test" },
        // The JSON-file "database" is shared state. Running tests in the same
        // process serially avoids write-write races between test files.
        pool: "forks",
        poolOptions: { forks: { singleFork: true } },
        // Standard reporter + coverage settings.
        reporters: ["default"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/**"],
            exclude: ["src/server.ts"],
        },
    },
});
