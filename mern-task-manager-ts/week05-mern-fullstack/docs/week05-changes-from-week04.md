# Changes from Week 4 → Week 5

Week 5 keeps the Week 4 React UI and the Week 3 Express + Mongoose
backend, and joins them into one working MERN app.

## Repository restructure

Backend files move into `server/`. The project now has two package
boundaries that are each independent npm packages, and one root
`package.json` whose only job is to orchestrate them.

| Before (Week 4)         | After (Week 5)             |
| ----------------------- | -------------------------- |
| `src/`                  | `server/src/`              |
| `tests/`                | `server/tests/`            |
| `tsconfig.json`         | `server/tsconfig.json`     |
| `vitest.config.ts`      | `server/vitest.config.ts`  |
| `package.json` (server) | `server/package.json`      |
| `client/*`              | `client/*` (unchanged)     |
| *(no file)*             | `package.json` (root)      |

## Added files

- `server/` package root (restructure).
- `client/src/services/api.ts` — `fetch` wrapper and `ApiError`.
- `client/tests/api.test.ts` — service-layer unit tests.
- `client/.env.example` — `VITE_API_URL`.
- `docs/week05-mern-fullstack.md`
- `docs/week05-changes-from-week04.md`

## Removed files

- `client/src/data/mockTasks.ts` — no longer needed; data comes from the
  API. The empty `client/src/data/` directory is removed as well.
- `docs/week04-*.md` — replaced by the Week 5 docs.

## Modified files

- `server/src/app.ts`
  - Imports `cors`.
  - `createApp()` now takes `{ clientUrl }`.
  - Applies `cors({ origin: clientUrl })` before the JSON body parser.
  - Welcome message updated.
- `server/src/server.ts`
  - Reads `CLIENT_URL` from the environment.
  - Passes it into `createApp({ clientUrl })`.
  - Logs the allowed origin at startup.
- `client/src/pages/Home.tsx`
  - Reads tasks via `api.listTasks()` in `useEffect`.
  - Tracks `loading` and `error` state.
  - Add / toggle / delete go through the API.
  - Replaces the mock seed.
- `client/src/pages/Home.css`
  - New rules for `.home__loading`, `.home__error`, `.home__retry`.
- `client/src/App.tsx` — subtitle updated.
- `client/tests/Home.test.tsx` — rewritten to mock the service.
- `server/tests/taskApi.test.ts`
  - Builds `createApp({ clientUrl: … })`.
  - New `describe("CORS", …)` section with three cases.
- Headers on moved files updated to `Week 05` and new `File:` paths.

## New dependencies

| Scope  | Package      | Why                           |
| ------ | ------------ | ----------------------------- |
| server | `cors`       | CORS middleware for Express.  |
| server | `@types/cors`| TypeScript types for `cors`.  |

No new client runtime dependencies.

## New npm scripts (root)

```jsonc
{
  "install:all": "npm --prefix server install && npm --prefix client install",
  "dev:server":  "npm --prefix server run dev",
  "dev:client":  "npm --prefix client run dev",
  "test:server": "npm --prefix server run test",
  "test:client": "npm --prefix client run test",
  "test":        "npm run test:server && npm run test:client"
}
```

## Environment variables

| Variable         | Scope  | Default                 | Purpose                               |
| ---------------- | ------ | ----------------------- | ------------------------------------- |
| `PORT`           | server | `3000`                  | API port                              |
| `MONGODB_URI`    | server | *(none)*                | Mongo connection string               |
| `CLIENT_URL`     | server | `http://localhost:5173` | Only origin allowed by CORS           |
| `VITE_API_URL`   | client | `http://localhost:3000` | Base URL the React app calls          |
