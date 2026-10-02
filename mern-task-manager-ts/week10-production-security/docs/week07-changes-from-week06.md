# Changes from Week 6 → Week 7

## Added files

- `server/src/auth/requireAuth.ts` — middleware + `Request.userId`
  module augmentation.

## Modified files

- `server/src/models/Task.ts`
  - New required field `userId` (ObjectId, ref: User, indexed).
  - Compound index `(userId: 1, createdAt: -1)`.
  - `toJSON` drops `userId` from the response.
- `server/src/controllers/taskController.ts`
  - All five handlers read `req.userId` via a `requireUserId` helper.
  - Every query filters by `{ _id: id, userId }`.
  - `addTask` pins `userId` from `req.userId`, ignoring any client
    value.
- `server/src/routes/taskRoutes.ts` — `router.use(requireAuth)`.
- `server/src/app.ts` — welcome message.
- `server/src/server.ts` — log line.
- `server/tests/taskModel.test.ts` — `userId` added to every valid
  create, new "requires userId" test, JSON transform test asserts
  `userId` is hidden.
- `server/tests/taskApi.test.ts` — fully rewritten. Covers 401
  rejection, ownership isolation across users, 404 (not 403), and
  spoofed `userId` prevention.
- `client/src/App.tsx` — subtitle.
- `server/package.json` — name/description bumped.

## No dependency changes

Week 7 reuses every package added in Week 6 — no new npm installs.

## No client-code changes

The React client already carries the auth cookie on every request.
That means the moment the backend starts enforcing auth, the UI
"just works" for authenticated users, and the Home page naturally
shows an empty list for a brand-new account.
