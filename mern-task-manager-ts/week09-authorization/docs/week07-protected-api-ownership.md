# Week 7 — Protected API + Ownership

## Learning objectives

By the end of this week a student can:

- Write Express middleware that rejects unauthenticated requests with
  401 and attaches an identity (`req.userId`) for the rest of the chain.
- Augment the Express `Request` type via TypeScript module
  augmentation, so controllers see `req.userId: string | undefined`
  without type gymnastics.
- Add owner fields to a Mongoose model, index them, and scope every
  query by owner on **read and write**.
- Choose between 403 and 404 when a user asks for a resource they do
  not own, and justify the choice.
- Prevent a client from spoofing ownership by *never* trusting
  `req.body.userId`.

---

## The ownership filter pattern

Every ownership-aware query follows one shape:

```ts
Task.findOne({ _id: id, userId: req.userId });
Task.findOneAndUpdate({ _id: id, userId: req.userId }, patch, …);
Task.findOneAndDelete({ _id: id, userId: req.userId });
```

The filter does the work. If the id exists but belongs to a different
user, the query returns `null` and the controller responds 404 — the
same shape as "id does not exist". That symmetry is both a feature
(less information to attackers) and a bug source if you forget to
check for null.

---

## Why not 403?

The HTTP spec distinguishes:

- `401 Unauthorized` — "You haven't told me who you are."
- `403 Forbidden` — "I know who you are, but you may not."
- `404 Not Found` — "I don't know what you're talking about."

For a task owned by user A, when user B asks for it, both 403 and 404
are technically correct. The industry has mostly settled on **404**
for private resources because 403 leaks the fact that the id exists.
If an attacker is enumerating ids looking for valid ones, 403 is a
helpful signal; 404 looks identical to the response for truly
non-existent ids. Our tests pin this behaviour explicitly.

---

## Why pin `userId` on the server?

A naive controller would write:

```ts
await Task.create({ ...req.body, userId: req.userId });
```

That is almost right, but `req.body` could contain a `userId` of its
own that overrides the trusted one. We instead whitelist the fields
we take from the body (`title`, `description`, `completed`) and set
`userId` ourselves. The included test `the server pins userId to the
caller` locks that behaviour in.

---

## Why the compound index?

MongoDB will serve `Task.find({ userId })` from the single-field index
we declared on `userId`. For `Task.find({ userId }).sort({ createdAt: -1 })`
it would then do an in-memory sort. The compound index
`(userId: 1, createdAt: -1)` lets Mongo serve the sort from the index
itself. On a per-user list in a UI that is the single most important
query to optimise.

---

## Testing strategy

Supertest's `agent()` makes multi-user tests easy: each agent has its
own cookie jar. We use three agents to prove isolation, and we never
hand-build JWTs — the register endpoint sets the right cookie for us.

Three edge cases that are easy to miss and worth their own test:

1. Spoofed `userId` in the body is ignored.
2. Response body never contains `userId`.
3. 404 (not 403) for cross-user access.
