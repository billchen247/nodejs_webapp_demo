# Week 7 — Teaching Notes

## Learning goals

- Students can write and apply an `authenticate` middleware.
- Students can scope database queries by owner.
- Students can distinguish 401, 403, 404 and choose the right one.
- Students can explain why the server, not the UI, is the security boundary.
- Students can test cross-user access with two browsers (or Postman + curl).

## Core concepts

### `req.user` is set by the server

```
cookie:token  ─► authenticate ─► verify JWT ─► load user ─► req.user = {id, name, email}
```

Every protected handler can trust `req.user.id` because the server
derived it from a token it signed itself.

### Owner-scoped queries

```js
Task.findOne({ _id: id, userId: req.user.id })
```

If the task exists but belongs to someone else, the query returns `null`
and the controller responds with 404. There's no separate "forbidden"
branch to forget.

### Why 404 for cross-user resources

- 403 says: "This exists, you can't have it."
- 404 says: "There is nothing here for you."
- For personal data, 404 reveals less about the system. Attackers can't
  harvest valid ids by probing.

### Where to run the middleware

`router.use(authenticate)` applies it to the entire task router. Any
new route added later is automatically protected. This is safer than
decorating each handler individually.

### Server-controlled fields

Any field whose value depends on **who the user is** must be set by
the server, not read from the request body. In our schema that's just
`userId`. In Week 9 it will also include `role`.

### UI reactions to 401

When the server returns 401, the client is in one of two states:

1. The cookie expired or was tampered with — treat as "logged out".
2. We never had a cookie — treat as "logged out".

Both reduce to "take the user to the login page." Our `Home` component
calls `onRequireLogin()` to switch views.

## Common student questions

**Why isn't `req.user.id` sometimes `undefined`?**
Because `authenticate` returned 401 before the handler ran, or because
the user forgot to apply `authenticate` to this route.

**What stops Alice from passing Bob's id in the request body?**
Our controllers ignore `req.body.userId` entirely. The owner is always
`req.user.id`.

**Why not use `permittedTo` style checks?**
We will, for roles, in Week 9. For simple ownership, scoping the query
is simpler, has no race condition, and can't be forgotten.
