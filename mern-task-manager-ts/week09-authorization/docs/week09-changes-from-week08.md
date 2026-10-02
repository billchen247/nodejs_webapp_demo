# Week 9 — What changed from Week 8

## What we had before
Week 8 ended with a React app that could log in, log out, protect
routes behind authentication, and consume a backend that scoped every
task to its owner. The app knew *who* the user was.

## What we added
A per-user **role** (`"user" | "admin"`), a reusable
**`requireRole`** middleware, admin-only endpoints under
`/api/users`, and an **admin dashboard** page that lets an admin
promote or demote other users.

## What we changed
- Authentication middleware now reads the user's role from the DB and
  stashes it on `req.userRole`, so authorization decisions always see
  the current role (not whatever role the token was issued with).
- The register controller explicitly ignores `req.body.role`. There
  is no path from a stranger to the admin role via the public API.
- The React NavBar shows a role badge and a conditional Admin link.
- The App router mounts `/admin` behind `<RequireRole role="admin">`.

## Files added

### Backend
- `server/src/auth/requireRole.ts`
- `server/src/controllers/userController.ts`
- `server/src/routes/userRoutes.ts`
- `server/src/scripts/seedAdmin.ts`
- `server/tests/userApi.test.ts`

### Frontend
- `client/src/components/RequireRole.tsx`
- `client/src/pages/Admin.tsx`
- `client/src/pages/Admin.css`
- `client/tests/Admin.test.tsx`
- `client/tests/RequireRole.test.tsx`

### Docs
- `docs/week09-authorization.md`
- `docs/week09-changes-from-week08.md`

## Files modified

### Backend
- `server/src/models/User.ts` — adds `role` field + enum.
- `server/src/auth/requireAuth.ts` — looks up the role.
- `server/src/controllers/authController.ts` — ignores client-sent role.
- `server/src/app.ts` — mounts `/api/users`.
- `server/package.json` — adds `seed:admin` script.

### Frontend
- `client/src/types.ts` — `AuthUser.role`.
- `client/src/services/api.ts` — new `admin` namespace.
- `client/src/App.tsx` — adds `/admin` route.
- `client/src/App.css` — role badge + nav links + forbidden styles.
- `client/src/components/NavBar.tsx` — role-aware nav.

### Tests (updated for the new `role` field on AuthUser)
- `client/tests/App.test.tsx`
- `client/tests/Auth.test.tsx`
- `client/tests/ProtectedRoute.test.tsx`
- `client/tests/api.test.ts`

## Dependencies added
None. Authorization is three lines of middleware; no library needed.

## Architecture change

Before:
```
Request → requireAuth → controller
```

After:
```
Request → requireAuth → requireRole(?) → controller
            ↓               ↓
          401            403
```

Routers compose these two:
```ts
router.use(requireAuth, requireRole("admin"));
```

## Testing changes
- Added authorization tests to the server suite covering
  `unauth → 401`, `user → 403`, `admin → 200/201`.
- Added "register ignores role" test to close the self-promotion gap.
- Added React tests for `<RequireRole>` and the admin dashboard page.
- Updated existing tests whose mocked `AuthUser` objects did not have
  a `role` field (TypeScript would have failed to compile).

## CSS / UI changes
- Role badge in the NavBar (user / admin pill).
- Admin dashboard table with promote/demote buttons.
- A "Forbidden" screen rendered by `<RequireRole>` for logged-in
  users with the wrong role (deliberately distinct from an anonymous
  redirect to `/login`).
- Mobile-friendly table on narrow viewports.

## New TypeScript concepts
- A string-literal **as const** tuple used to derive a type:
  ```ts
  export const USER_ROLES = ["user", "admin"] as const;
  export type UserRole = (typeof USER_ROLES)[number];
  ```
  One source of truth for the enum, derivable types, no drift between
  the array and the type.
- Augmenting Express's `Request` to add two typed fields (`userId`,
  `userRole`) so downstream controllers get help from the compiler.

## New concepts
- The 401/403 distinction.
- "Fail closed" (unknown role → deny) vs "fail open" (unknown role → allow).
- The "security is server-side" slogan.
- Idempotent admin seeding scripts.
- Guarding against self-demotion.

## Why we made these changes
The app already knew *who* each user was. Without authorization, we
either had to treat all authenticated users identically, or we had to
sprinkle `if (user.email === "admin@…")` style checks through the
controllers — which is both brittle and insecure. Introducing a
proper role gives us a single, auditable place to decide what each
request is allowed to do.

## Classroom demonstration

1. Log in as a regular user. Hit `/api/users` with
   `curl --cookie-jar/--cookie`. See **403 Forbidden**.
2. Stop the server. Run
   `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=longenough npm --prefix server run seed:admin`.
3. Reload the browser. The NavBar now shows an "admin" badge and the
   Admin link. The admin dashboard lists every user and lets you
   promote or demote them.
4. In DevTools, change the user's role to `"admin"` in the React
   DevTools memory. The link appears, but the server keeps returning
   403. **Hiding a button in React is not authorization.**
