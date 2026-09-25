/* @author Bill Chen */
import { defineConfig } from "vitest/config";

/* ---------------------------------------------------------------------------
 * vitest.config.ts
 *
 * Same Vitest + mongodb-memory-server setup as todo-mongo-api-express. See
 * that project's config for the rationale.
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
