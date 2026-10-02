# Week 10 — Production Security Hardening (deep dive)

This document is the long-form companion to the Week 10 README. The
README is the "what" and the "how"; this file is the "why", with the
trade-offs and the historical mistakes each decision avoids.

---

## 1. The threat model

Before adding any single control, write down what you're defending
against. A small, honest threat model is better than a long, aspirational
one.

For this classroom project:

| Threat | What it looks like | What stops it |
| --- | --- | --- |
| Credential stuffing | Attacker tries 10M email/password pairs on `/login` | Rate limiter + bcrypt cost |
| Session theft via XSS | Malicious JS reads the auth cookie | `HttpOnly` cookies |
| Session theft via CSRF | Evil site POSTs to our API using the user's cookies | `SameSite=Lax/None`, CORS |
| Replayed access token | Attacker captures a 7-day JWT and keeps using it | Short access token + narrow refresh |
| Account enumeration | Attacker checks which emails have accounts | Same-error login, always-200 forgot |
| Reset-token theft via DB | DB leak reveals live reset links | Hash of token stored, not token itself |
| Oversized body DoS | Attacker POSTs 2 GB of JSON | `express.json({ limit })` |
| Resource existence leaks | Attacker guesses task ids by status | 404 over 403 for other users' tasks |
| Error-page info leaks | Attacker reads server stack traces | Stacks hidden in production |

What this project is **not** defending against: a motivated attacker
with code execution on the server, a compromised build pipeline, or
anyone with the JWT_SECRET. Those require different controls
(hardware security modules, signed builds, zero-trust networking).

---

## 2. Access tokens vs refresh tokens

### The problem

If we sign a single JWT with a 7-day lifetime and set it as a cookie,
then a token that escapes (via a one-time XSS, a shoulder surf, a
leaked log, a shared screen) is good for *seven days*. Stateless JWTs
cannot be revoked without extra state.

### The pattern

Issue two cookies at login time:

| Cookie | Path | Lifetime | Purpose |
| --- | --- | --- | --- |
| Access  | `/`           | 15 minutes | Attached to every API call |
| Refresh | `/api/auth`   | 7 days     | Only sent to the one endpoint that mints access tokens |

`/api/auth/refresh` verifies the refresh cookie and issues a fresh
access cookie. The frontend fetch wrapper automatically calls `/refresh`
when any protected API returns 401.

### Why the narrow refresh path

The refresh cookie is the "high-value" cookie. If it leaks, the attacker
gets a 7-day pass. Browsers only send a cookie to a URL whose path is a
prefix of the cookie's path. By setting `path: "/api/auth"`, the refresh
cookie never travels with `/api/tasks` or any other API call. One
leaked XSS fetch inside the SPA can only exfiltrate what the browser
sends — and the browser never sends refresh to `/api/tasks`.

### The `typ` claim

Every token carries `typ: "access"` or `typ: "refresh"`. The verifier
takes an `expectedType` argument. This means:

- `/api/auth/refresh` only accepts `typ === "refresh"`.
- `requireAuth` only accepts `typ === "access"`.

So even if an attacker tricked the browser into sending a refresh token
in the access cookie slot (or vice versa), the server would still
reject it.

### What we did NOT do (and why it was tempting)

- **Rotate refresh tokens on every refresh**. This detects stolen
  refresh tokens — the real user's refresh suddenly becomes invalid,
  which an operator can notice. But it adds state (a per-user "current
  refresh" record), extra DB roundtrips, and race conditions when two
  tabs refresh at the same time. For a classroom app, the short access
  token is enough; the production path upgrade is clearly documented.

---

## 3. Cookie attributes, carefully

```ts
res.cookie(name, token, {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  path: "/" | "/api/auth",
  maxAge: ...,
});
```

- `HttpOnly` — `document.cookie` cannot read the value. The XSS "steal
  my session cookie" attack class goes away.
- `SameSite=Lax` in dev — the browser does NOT send cookies on
  cross-origin POSTs initiated by other sites, blocking the simplest
  CSRF attack. Lax still allows top-level GET navigation (useful for
  password-reset email links).
- `SameSite=None; Secure` in prod — needed because the SPA is served
  from a different origin than the API. `Secure` forces HTTPS.
- `Path` — narrows which URLs trigger the cookie; see the refresh
  discussion above.
- `maxAge` — persistent cookies (not session cookies) so a tab close
  doesn't log the user out mid-session.

---

## 4. Zod validation at the edge

Why not inline validation inside each controller?

- A central schema is the single source of truth for both runtime
  checks and TypeScript types (`type RegisterBody = z.infer<typeof registerSchema>`).
- `strict()` means an unexpected key in the body is a validation error,
  not a silently stripped one. This closes the `register(..., { role: "admin" })`
  attack: no need to remember to delete `req.body.role` — zod refuses
  to parse it.
- Normalisation (`.trim()`, `.toLowerCase()`) happens exactly once, at
  the boundary. Controllers never have to re-munge email strings.

The middleware is six lines:

```ts
export function validateBody<T>(schema: ZodSchema<T>) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Validation failed", details: formatZodError(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}
```

That's it. The hard work is in the schemas. The error response has a
`details` map keyed by field name so the frontend can highlight the
right input.

---

## 5. Rate limiting

### Two limiters

| Limiter | Window | Max | Scope |
| --- | --- | --- | --- |
| `authLimiter`    | 15 minutes | 20   | `/api/auth/*` |
| `generalLimiter` | 1 minute   | 300  | Everything else |

The auth limiter is strict because each attempt on `/login` is a
free guess at a password. 20 per 15 minutes is more than any legitimate
user needs, and far fewer than any brute-forcer needs.

The general limiter is loose because a React app doing a burst of
reads shouldn't be throttled. 300 req/min is a reasonable "I noticed
something is wrong" threshold.

### Why both are skipped in tests

Tests legitimately make hundreds of auth requests per second. The
limiter would reject most of them, producing flaky-looking failures
whose root cause has nothing to do with the code under test.
`skip: () => isTest()` keeps the limiter in the pipeline (so it still
registers middleware order correctly) but short-circuits the counting.

### Trust proxy

Without `app.set("trust proxy", 1)`, Express treats the TCP peer as
the client — which, behind a load balancer, is the load balancer. Every
request appears to come from one IP, so one rate-limit bucket covers
the entire internet. The value `1` means "trust exactly one hop";
larger numbers chain more hops. Trust only proxies you control.

---

## 6. Helmet

`helmet()` applies a dozen default headers in one line. Of those, the
ones that matter most for a JSON API:

- `X-Content-Type-Options: nosniff` — browsers must not guess
  content types. Blocks a family of attacks where a response is coerced
  into being interpreted as HTML or JS.
- `Strict-Transport-Security` (behind HTTPS) — tells browsers never to
  speak HTTP to this host again.
- `X-DNS-Prefetch-Control: off` — prevents the browser from preloading
  domain lookups mentioned in responses.
- `Referrer-Policy: no-referrer` — don't leak the full URL in the
  Referer header.

CSP is disabled here because the API only returns JSON and local
tooling like Swagger UI gets caught in the default CSP. CSP belongs
on the frontend host.

---

## 7. Password reset — the right way

A reset flow has three failure modes a casual implementation gets wrong:

1. **User enumeration.** If `/forgot-password` returns 404 for unknown
   emails, an attacker can probe to learn which emails have accounts.
   Fix: always respond 200.
2. **Token in the clear in the DB.** If we store the plaintext reset
   token, a DB leak gives the attacker working reset links. Fix: store
   `sha256(token)` and compare the hash on redemption.
3. **Token replay.** If we don't clear the token after use, a stolen
   token still works. Fix: single-use, cleared on redeem.

Additional notes:

- Tokens are 32 random bytes (`crypto.randomBytes(32).toString("hex")`)
  — not UUIDs. UUIDs are not secrets; they're identifiers.
- Tokens expire after one hour. Short enough to limit the window;
  long enough that a user who clicks "reset" and leaves it for lunch
  can still use it.
- `/reset-password` does *not* auto-log the user in. Making them sign
  in afterwards removes one tricky "wait, who is this session?" flow.
- The dev build returns `devToken` directly in the response for
  classroom use. Students should see that this is explicitly flagged
  as non-production.

---

## 8. Transparent client-side refresh

The fetch wrapper owns the retry so no page component ever thinks
about expiry:

```ts
if (response.status === 401 && !_retrying && !noRefresh) {
  const refreshed = await tryRefresh();
  if (refreshed) return request(path, { ...init, _retrying: true });
}
```

Three things are worth noticing:

- **Single-flight refresh.** `inflightRefresh` serialises concurrent
  callers through one promise. If 5 fetches 401 at once, only one
  `/refresh` call fires — and the other 4 await the same result.
- **`noRefresh` opt-out.** `/me` and `/refresh` itself opt out, because
  their whole purpose is to tell us whether we're logged in.
- **One retry max.** `_retrying: true` on the retried call prevents a
  loop if the retried call also 401s (which would mean the refresh
  briefly succeeded but the user is still unauthorised).

---

## 9. Error ergonomics

```ts
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const body = { error: "Internal Server Error" };
  if (!isProd() && err instanceof Error) {
    body.message = err.message;
    body.stack = err.stack;
  }
  res.status(500).json(body);
});
```

- **Always log on the server.** Operators cannot debug what they
  cannot see.
- **Never leak the stack in production.** Stack traces mention file
  paths, library versions, SQL fragments — a free gift to an attacker.
- **Keep the stack in dev.** Students and local developers need the
  signal.

---

## 10. What a production rollout would still need

This project is explicitly a teaching surface. Before shipping to the
real internet you would also want:

- **A real email provider** for the reset flow (SendGrid, Postmark,
  SES) and the dev-token leak removed.
- **A shared rate-limit store** (`rate-limit-redis`) so multiple server
  instances share the counter.
- **A secrets manager** for `JWT_SECRET` with a rotation policy.
- **Audit logging** for admin actions (role changes, resets).
- **MFA** for admin accounts.
- **A WAF** in front of the API for pattern-based attack blocking.
- **Content Security Policy** on the frontend host.
- **Dependency scanning** (`npm audit`, Snyk, Dependabot).
- **Penetration testing** before go-live and after major releases.

None of these are a replacement for the controls in this project —
they're the next layer out.
