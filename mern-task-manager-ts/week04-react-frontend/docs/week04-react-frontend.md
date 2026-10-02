# Week 4 — React Frontend (Teaching Notes)

## Learning goals

By the end of this week, a student should be able to:

1. Explain what a React component is and how JSX relates to HTML.
2. Describe props and state and the difference between them.
3. Write a controlled form (input value backed by state).
4. Lift state up to a parent component when two children need to share it.
5. Write a Testing Library test that queries by accessible roles and labels.
6. Author modern plain CSS with custom properties and Flexbox/Grid.

## React in two sentences

A React app is a tree of functions (components). Each function receives
props, calls `useState` for any local memory, and returns JSX that
describes what the DOM should look like right now.

Everything else — events, forms, lists, filters — is just arranging those
pieces.

## State ownership

The `Home` page owns `tasks` and `filter`. Why not put them in `TaskList`?
Because `TaskForm` also needs to add tasks, and two siblings cannot share
state. The lowest common ancestor is `Home`, so that is where the state
lives. Callbacks (`onAdd`, `onToggle`, `onDelete`) flow down; events flow up.

## Controlled vs. uncontrolled

Controlled:
```tsx
<input value={title} onChange={(e) => setTitle(e.target.value)} />
```

Uncontrolled (we do NOT use these):
```tsx
<input defaultValue="..." ref={inputRef} />
```

Controlled is almost always the right default — it lets you validate,
transform, and clear from React code.

## Testing Library mindset

The Testing Library docs put it bluntly:

> *The more your tests resemble the way your software is used, the more
> confidence they can give you.*

That is why we query by role, label, text — the same signals a user
(or a screen reader) would use. `getByClassName` is a code smell.

## CSS without a framework

- One file (`index.css`) exposes design tokens via CSS custom properties.
- Each component has a `.css` next to its `.tsx` and uses BEM-ish class
  names (`.task-item__title`, `.task-item--done`).
- Dark mode is one `@media (prefers-color-scheme: dark)` block that
  swaps the tokens — the components themselves do not know what mode
  they are in.
- `clamp()` in the page title gives us typography that scales with the
  viewport without a bunch of media queries.

Students will have Tailwind pitched to them by the Internet. Spend ten
minutes showing that **modern plain CSS is fine** and the vocabulary
transfers to any framework they adopt later.

## What stayed the same from Week 3

- Everything in the backend: `src/`, `tests/`, `vitest.config.ts`.
- The `.env.example` and `MONGODB_URI` requirement for the server.
- The ability to run `npm run test` and get an all-green backend suite.

## What is intentionally missing

- No `fetch` call to the backend yet (that is Week 5).
- No routing library (that is Week 8).
- No authentication (Week 6).

Resisting the urge to add these this week is the pedagogical point: one
new concept per snapshot.

## Where we go next

- **Week 5:** build a `services/api.ts` that uses `fetch` to call the
  Express API, add CORS to the backend, and reorganise the project into
  `server/` and `client/`.
