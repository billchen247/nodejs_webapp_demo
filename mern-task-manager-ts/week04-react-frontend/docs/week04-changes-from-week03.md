# Week 4 — Changes from Week 3

## What We Had Before

A persistent REST API (Express + Mongoose + MongoDB) with full CRUD and
a Supertest-backed test suite. No UI.

## What We Added

- A whole new `client/` directory containing a React + TypeScript app
  bootstrapped with Vite.
- The `Task`, `TaskList`, `TaskItem`, and `TaskForm` components, plus a
  `Home` page that owns the state.
- A modern plain-CSS design system (`client/src/index.css`) built on
  custom properties, with light and dark variants.
- A React Testing Library + Vitest + jsdom test setup in `client/tests/`.
- Convenience scripts at the project root to delegate to the client:
  `npm run dev:client`, `npm run install:client`, `npm run test:client`,
  `npm run test:client:coverage`.

## What We Changed

- `.gitignore` was expanded to cover the new `client/node_modules`,
  `client/dist`, `client/coverage`, and `client/package-lock.json`.
- `README.md` now covers both the backend and the frontend.

## What We Did NOT Change

- The entire backend: `src/`, `tests/`, `package.json` dependencies,
  `MONGODB_URI`, API endpoints, test coverage expectations.
- The React UI does **not** call the backend yet. It still works if the
  backend is offline. That is a deliberate choice to keep this snapshot
  focused on React itself.

## Files Added (new frontend)

```
client/package.json
client/tsconfig.json
client/vite.config.ts
client/vitest.config.ts
client/index.html
client/src/main.tsx
client/src/App.tsx
client/src/App.css
client/src/index.css
client/src/types.ts
client/src/data/mockTasks.ts
client/src/pages/Home.tsx
client/src/pages/Home.css
client/src/components/TaskForm.tsx
client/src/components/TaskForm.css
client/src/components/TaskItem.tsx
client/src/components/TaskItem.css
client/src/components/TaskList.tsx
client/src/components/TaskList.css
client/tests/setup.ts
client/tests/TaskForm.test.tsx
client/tests/TaskList.test.tsx
client/tests/Home.test.tsx
docs/week04-react-frontend.md
docs/week04-changes-from-week03.md
```

## Files Modified

- `package.json` (added `*:client` scripts, kept backend deps)
- `.gitignore` (added client/* paths)
- `README.md` (covers both halves)

## Files Removed

- `docs/week03-*.md`

## Dependencies Added (client)

- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`
- `vitest`, `@vitest/coverage-v8`, `jsdom`
- `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- `typescript`, `@types/react`, `@types/react-dom`

The backend deps are unchanged.

## Architecture Change

```
Week 3:
   Express + Mongoose + MongoDB
   (no UI)

Week 4:
   Express + Mongoose + MongoDB      ← untouched
   client/ (React + Vite)            ← NEW, uses mock data
```

The two halves still do not talk to each other. Week 5 fixes that.

## Testing Changes

- Added a second test suite in `client/tests/` that runs under Vitest's
  jsdom environment with React Testing Library.
- Tests focus on **observable user behavior** (click, type, read screen)
  rather than component internals.

## CSS/UI Changes

- Introduced `client/src/index.css` as the single source of design tokens.
- Introduced a BEM-ish class-naming convention (`.task-item`, `.task-item__title`,
  `.task-item--done`).
- Introduced `prefers-color-scheme` dark mode support.
- Introduced visible focus styles, aria-labels, and semantic HTML
  throughout.

## New TypeScript Concepts

- Explicit props interfaces for every component (`TaskFormProps`, etc.).
- Discriminated-union-style `TaskFilter` type (`"all" | "active" | "completed"`).
- `FormEvent<HTMLFormElement>` and other `@types/react` event types.

## New Concepts

- Components, props, JSX.
- `useState`, `useMemo`.
- Controlled forms.
- Lifting state up to the lowest common ancestor.
- Keys when rendering lists.
- Testing Library's behaviour-first philosophy.
- Design tokens via CSS custom properties.

## Why We Made These Changes

A pure backend is interesting, but students want to see something on the
screen. Week 4 lets them touch the UI and build React muscle memory
without worrying about CORS, loading states, or JSON contracts. Then
Week 5 wires it up for real.

## Classroom Demonstration

1. Run `npm run dev:client`. Point out: no backend is running, yet the
   page works.
2. Walk through `Home.tsx`. "This is where the state lives."
3. Walk through `TaskForm.tsx`. "This never touches the DOM directly —
   React is the source of truth."
4. Run `npm run test:client`. Open `TaskForm.test.tsx` and show how
   Testing Library mimics a human.
5. Change `--color-primary` in `index.css`. The buttons update
   immediately — proof the design system works.
