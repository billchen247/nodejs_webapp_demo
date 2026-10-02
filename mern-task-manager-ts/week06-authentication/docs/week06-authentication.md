# Week 6 — Authentication

## Learning objectives

By the end of this week a student can:

- Explain why passwords must be hashed (never encrypted, never plain),
  and why bcrypt is a good choice over SHA-* or MD5.
- Describe what a JWT is, what `HS256` means, and why pinning the
  algorithm on the verifier matters.
- Choose between an `Authorization: Bearer` header and an HTTP-only
  cookie for session delivery, and defend the choice.
- Configure CORS for a credentialed cross-origin app.
- Build register / login / logout / "who am I?" endpoints that avoid
  common footguns: user enumeration, hash leakage, stale cookies.

---

## Why bcrypt?

Fast hashes like SHA-256 are a terrible fit for passwords: an attacker
with a stolen database can try billions per second on a GPU. A good
password hash is *deliberately slow* and includes a per-user **salt**.
bcrypt satisfies both. The cost factor (10 here) can be bumped up as
hardware improves — your old hashes keep working because the cost is
embedded in the stored hash itself.

Alternatives: argon2 is arguably stronger and now preferred by many
teams. We stick with bcrypt because it is the most widely-taught option
and the one students will encounter most often in existing codebases.

---

## Why JWT in a cookie?

Two common patterns:

1. **JWT in an `Authorization: Bearer` header.** The client stores the
   token in `localStorage` and attaches it to every request. Simple to
   implement. Fatal flaw: any XSS vulnerability on the page can read
   `localStorage` and steal the token.

2. **JWT in an HTTP-only cookie.** The browser sends it automatically.
   Page JavaScript cannot read it. XSS no longer leaks the session.

We use (2). The cost is CSRF — any page the user visits can trigger
cross-origin requests that carry the cookie. We mitigate that with
`SameSite=Lax`, which blocks the dangerous shapes (cross-site POST,
PUT, DELETE). Week 10 revisits CSRF when we think about multiple
subdomains.

---

## Guarding against user enumeration

A login endpoint that says "unknown email" when the email is unknown
and "wrong password" when the email is known is a slow but reliable
*user-list leak*: an attacker can discover which emails are registered.

Our implementation returns `"Invalid email or password"` for both
cases. This is a small comfort improvement for the attacker (they
still get a signal), but it closes the oracle.

---

## Testing strategy

Three suites, three audiences:

- `server/tests/authApi.test.ts` — true integration. Starts the Express
  app, uses Supertest's `agent()` so cookies persist across calls, and
  asserts on cookie flags (`HttpOnly`) by reading the raw `Set-Cookie`
  header.
- `client/tests/Auth.test.tsx` — React Testing Library tests on Login
  and Register. The service layer is mocked so we exercise user flows,
  not HTTP.
- `client/tests/App.test.tsx` — exercises the "auth router":
  checking-session → login screen → task page → logout → login screen.

---

## Checklist for the week

- [ ] `User.passwordHash` has `select: false`.
- [ ] `User.toJSON` drops `passwordHash` from the response.
- [ ] Register and login both return the user and set the cookie.
- [ ] Register returns 409 on duplicate email.
- [ ] Login returns 401 (same message) for unknown email AND bad password.
- [ ] `/me` returns `{ user: null }` for missing/invalid/stale cookies.
- [ ] CORS runs with `credentials: true` and a single allowed origin.
- [ ] React API client sets `credentials: "include"` on every request.
- [ ] Login/Register pages show errors inline and clear them on retry.
