# Week 4 — React Frontend

> **Question of the week:** *How do we build the UI?*

The backend from Week 3 is still there, unchanged (Express + Mongoose + MongoDB).
This week we introduce **React** in a new `client/` directory. It renders a
real task UI — add, toggle, delete, filter — but it uses **mock data** for
now. Week 5 will connect it to the Express API.

Keeping the two universes separate for one week lets students focus on React
without any CORS, fetch, or network-error questions getting in the way.

---

## What this week teaches

- React + TypeScript basics: components, props, state, events.
- `useState`, `useMemo`, controlled form inputs.
- Lists, keys, and conditional rendering.
- Pure (presentational) components vs. stateful (container) components.
- Modern plain CSS with custom properties, Flexbox, Grid, and
  prefers-color-scheme.
- Accessible forms, labels, roles, and focus styles.
- React Testing Library + Vitest for behaviour-focused component tests.

---

## Project layout

```
week04-react-frontend/
├── package.json                 # backend (unchanged shape from Week 3)
├── src/, tests/                 # backend code and tests (from Week 3)
├── client/
│   ├── package.json             # separate frontend package
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx / App.css
│   │   ├── index.css            # design tokens
│   │   ├── types.ts
│   │   ├── data/mockTasks.ts
│   │   ├── pages/
│   │   │   └── Home.tsx / Home.css
│   │   └── components/
│   │       ├── TaskForm.tsx / TaskForm.css
│   │       ├── TaskItem.tsx / TaskItem.css
│   │       └── TaskList.tsx / TaskList.css
│   └── tests/
│       ├── setup.ts
│       ├── TaskForm.test.tsx
│       ├── TaskList.test.tsx
│       └── Home.test.tsx
└── docs/
    ├── week04-react-frontend.md
    └── week04-changes-from-week03.md
```

---

## Installation

Install dependencies in **both** places (the frontend has its own
`package.json`):

```bash
cd week04-react-frontend
npm install
npm run install:client
```

Delete any `package-lock.json` either command creates (both are ignored by git).

---

## Running

Backend (same as Week 3 — nothing uses it yet from React):

```bash
cp .env.example .env   # if you haven't yet
npm run dev
```

Frontend:

```bash
npm run dev:client
# Vite serves on http://localhost:5173
```

Open http://localhost:5173 in a browser and try:

- Adding a task through the form.
- Toggling a task's checkbox.
- Deleting a task.
- Clicking "All / Active / Completed".

The browser is the only state — refreshing wipes everything.

---

## Running tests

Backend tests (unchanged from Week 3):

```bash
npm run test
npm run test:coverage
```

Frontend tests:

```bash
npm run test:client
npm run test:client:coverage
```

Frontend tests run in `jsdom` with React Testing Library + Vitest. They
behave the way a user does: type into inputs, click buttons, read what the
screen says.

---

## Important files

- `client/src/pages/Home.tsx` — owns the task state, wires the form and list.
- `client/src/components/TaskForm.tsx` — controlled form with validation.
- `client/src/components/TaskList.tsx` — list + empty state.
- `client/src/components/TaskItem.tsx` — single row, purely presentational.
- `client/src/index.css` — design tokens (colors, spacing, shadows). Change
  one variable here and the whole app shifts.
- `client/tests/*.test.tsx` — behaviour-focused tests.

---

## New dependencies this week (frontend)

- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`
- `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- `jsdom`, `vitest`, `@vitest/coverage-v8`

---

## Architecture

```
Browser
   │
   ▼
Vite dev server (port 5173)
   │
   ▼
React App
   ├─ pages/Home.tsx           (owns task state)
   │     ├─ TaskForm           (controlled input)
   │     └─ TaskList
   │           └─ TaskItem[]
   │
   └─ data/mockTasks.ts        (local-only mock data)

(backend from Week 3 lives separately and is not called yet)
```

---

## Suggested classroom demonstration

1. Run `npm run dev:client` and show the UI in a browser.
2. Walk through `Home.tsx`: `useState`, `useMemo`, the three callbacks.
3. Compare "controlled" input (TaskForm) with "uncontrolled" (traditional
   HTML). Why does React want to be the source of truth?
4. Open `TaskItem.tsx`: a component with **zero state of its own**. Point
   out that this is why it is trivial to test.
5. Run `npm run test:client` and open one test file. Highlight how we
   query by role, label, and text — not by class name.
6. Edit `client/src/index.css`: change `--color-primary` and watch the
   whole UI shift.

---

## What students should understand after this lesson

- React components are functions that take props and return JSX.
- State lives as high as it needs to — in `Home.tsx` here. Callbacks go
  **down** the tree, data flows **up** via events.
- A controlled form is one where React state is the source of truth.
- Testing a React component is best done by simulating a user: find the
  button, click it, assert on what the screen shows.
- Our CSS strategy is just plain CSS with custom properties — no Tailwind,
  no CSS-in-JS, no Bootstrap. It scales a lot further than you'd think.
