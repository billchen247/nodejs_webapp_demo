# Changes from Week 5 → Week 6

## Added files

Server:

- `server/src/models/User.ts` — User model, bcrypt helpers.
- `server/src/auth/jwt.ts` — sign / verify HS256 tokens.
- `server/src/auth/cookie.ts` — HTTP-only cookie set/clear.
- `server/src/controllers/authController.ts` — register, login, logout, me.
- `server/src/routes/authRoutes.ts`
- `server/tests/authApi.test.ts` — 14 tests.

Client:

- `client/src/pages/Login.tsx`
- `client/src/pages/Register.tsx`
- `client/src/pages/AuthForm.css`
- `client/tests/Auth.test.tsx`
- `client/tests/App.test.tsx`

## Modified files

- `server/package.json` — add `bcrypt`, `cookie-parser`, `jsonwebtoken`
  and their `@types/*`.
- `server/src/app.ts` — mount `cookieParser()`, `/api/auth` routes;
  CORS runs with `credentials: true`.
- `server/src/server.ts` — fail-fast check on `JWT_SECRET`.
- `server/.env.example` — add `JWT_SECRET`.
- `server/tests/setup.ts` — set `JWT_SECRET` for the test run.
- `client/src/types.ts` — add `AuthUser`.
- `client/src/services/api.ts` — add `credentials: "include"` on every
  call; add `api.auth.*` namespace.
- `client/src/App.tsx` — session fetch on mount, login/register/home routing.
- `client/src/App.css` — new `.app__authbar` styles.
- `client/tests/api.test.ts` — assert `credentials: include`, cover `auth.*`.
- Headers on every file bumped to Week 06.

## No changes to

- Task model, task routes, task controller (that is Week 7).
- Existing Home / TaskForm / TaskList / TaskItem components.
- Mongo setup, Vite config, tsconfig.

## New dependencies

| Scope  | Package                 | Why                               |
| ------ | ----------------------- | --------------------------------- |
| server | `bcrypt`                | Hash and verify passwords.        |
| server | `jsonwebtoken`          | Sign and verify JWTs.             |
| server | `cookie-parser`         | Populate `req.cookies`.           |
| server | `@types/bcrypt`         | TypeScript types.                 |
| server | `@types/jsonwebtoken`   | TypeScript types.                 |
| server | `@types/cookie-parser`  | TypeScript types.                 |

## New environment variables

| Variable      | Scope  | Purpose                               |
| ------------- | ------ | ------------------------------------- |
| `JWT_SECRET`  | server | HS256 signing key, 32+ chars.         |
