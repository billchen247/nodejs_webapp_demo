/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 07
 * File: client/src/vite-env.d.ts
 *
 * Vite's ambient types.
 *
 * The triple-slash reference pulls in types for `import.meta.env`,
 * `import.meta.hot`, and the various Vite asset imports. Without this
 * file, `import.meta.env.VITE_API_URL` is a TypeScript error even
 * though Vite itself handles it fine at runtime.
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
