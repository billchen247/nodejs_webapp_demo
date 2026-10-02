# Week 4 — Teaching Notes

## Learning goals

- Students can create a React project with Vite.
- Students can read and write JSX.
- Students can lift state up to a parent component.
- Students can connect inputs to state with controlled components.
- Students can style components with plain CSS files + CSS variables.
- Students can design a responsive layout with Flexbox and Grid.

## Core concepts

### What is React?

React is a **library for building UIs** from small, reusable components.
A component is a function that returns JSX, which looks like HTML but is
really a syntax for creating `React.createElement(...)` calls.

### State lives somewhere

If two components need the same data, the data lives in their closest
common parent. In our case `Home.jsx` owns `tasks` and `filter`; it
passes handlers down to `TaskForm`, `TaskList`, and `TaskItem` via props.

### Controlled inputs

React maintains the source of truth for input values:

```jsx
const [title, setTitle] = useState("");
<input value={title} onChange={(e) => setTitle(e.target.value)} />;
```

This makes validation, resetting, and derived state trivial.

### Lists and keys

When rendering an array, each item needs a stable `key` (not the array
index). React uses the key to decide what to re-render.

### CSS strategy

- **One global stylesheet** (`index.css`) defines CSS custom properties:
  colors, spacing, radii, typography.
- **One stylesheet per component** keeps styles close to the markup.
- We use **Flexbox** for one-dimensional layouts (form fields, toolbar)
  and **Grid** for two-dimensional ones (task item: checkbox / body /
  actions).
- `clamp()` makes the heading responsive without media queries.
- A `@media (max-width: 540px)` rule reshapes task items on narrow screens.
- `:focus-visible` keeps keyboard focus clearly visible — accessibility.

### Why mock data?

Learning React + REST at the same time doubles the number of things that
can go wrong. By keeping Week 4 purely about React, students can focus on
rendering, state, and events. Week 5 introduces `fetch`, CORS, loading
and error states.

## Common student questions

**Why doesn't my change show up?**
State is immutable. `tasks.push(...)` won't trigger a re-render — you
need `setTasks([...])`.

**Why do I need `key`?**
React needs a stable identity for each list element to update the DOM
efficiently.

**Why can't I just use `document.getElementById`?**
You can, but React wants to own the DOM. Reading from inputs via state
is simpler and composes better.

**Where should state live?**
"As low as possible, as high as necessary." If one component uses it, it
lives there. If siblings share it, lift it to their parent.
