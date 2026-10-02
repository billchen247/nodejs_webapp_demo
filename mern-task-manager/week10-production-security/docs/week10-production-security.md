# Week 10 — Teaching Notes

## Learning goals

- Students can list five hardening steps and explain what each defends
  against.
- Students can configure helmet, express-rate-limit, and
  express-validator in a new Express project.
- Students can design a safe password reset flow.
- Students can tell CSRF, XSS, and open-redirect apart.
- Students can run a security checklist on an unfamiliar codebase.

## Core concepts

### 1. Defense in depth

No single control is enough. The task controller never trusts the
request body (validators checked it); the task controller also scopes
every query by `userId` (so even if validation missed something, you
can't read another user's data). Each layer assumes the one above it
might have failed.

### 2. HTTP headers (helmet)

Helmet writes about a dozen security headers. The ones worth
mentioning in class:

| Header                        | Protects against                           |
| ----------------------------- | ------------------------------------------ |
| `Content-Security-Policy`     | XSS by restricting script sources (strict) |
| `X-Content-Type-Options`      | MIME sniffing of a crafted response        |
| `Strict-Transport-Security`   | SSL downgrade attacks                      |
| `Referrer-Policy`             | Leaking URLs to third parties              |
| `X-Frame-Options`             | Clickjacking                               |

For an API-only server, the strict CSP that helmet ships by default
is fine — our clients receive JSON, not HTML.

### 3. Rate limiting

```js
authLimiter: 10 failed POSTs / 15 minutes per IP
```

Rate limiting does not stop a determined attacker with a botnet. It
does make casual brute force (a single attacker in a coffee shop)
impractical, and it prevents a bug in your own frontend from
hammering the DB.

### 4. Validation at the boundary

Mongoose validation is still useful, but by the time a document is
being validated we've already hashed a password, done a `findOne`,
etc. Validators at the HTTP boundary stop bad requests before any
work happens, and give the client a clear error listing every bad
field.

### 5. CORS allowlist + credentials

Three independent gates:

- **CORS**: the browser enforces this. The backend decides who to
  allow.
- **SameSite cookies**: the browser decides whether to send the auth
  cookie on cross-site requests.
- **CSRF**: a specific class of attack mitigated by `SameSite=Lax` or
  `Strict` plus an allowlisted CORS origin.

`Origin: "*"` with `credentials: true` is impossible by design — the
browser refuses. So the allowlist is non-optional for any app with
cookie auth.

### 6. Password reset — the three traps

1. **Leak**: "Email not found" lets attackers enumerate accounts.
   Return the same message for every email.
2. **Replay**: If the token is stored raw and the DB leaks, every
   outstanding reset link becomes a password-equivalent. Store the
   SHA-256 hash and compare against the hashed form.
3. **Expiration**: A reset link valid forever is a backdoor. 15–60
   minutes is standard.

### 7. Fail fast

The server exits during startup if `JWT_SECRET` is weak in
production. The alternative — booting silently insecure — is far
worse than a crash.

### 8. Error responses

Production error bodies are a boring `{ error: "Internal Server
Error" }`. Everything else goes to logs. Stack traces, DB field names,
and library versions are useful to attackers and should not reach the
client.

## Common student questions

**Why do I still see 429s in dev when I'm the only user?**
Because `authLimiter` counts failed attempts and the window is 15
minutes. Restart the server or shorten `RATE_LIMIT_WINDOW_SECONDS` in
`.env`.

**Does helmet replace HTTPS?** No. HTTPS protects data in flight; the
headers help the browser once the response has arrived. You need
both. Terminate TLS at your reverse proxy.

**Why aren't we using JWT in `localStorage`?** Because XSS can read
`localStorage` but cannot read `HttpOnly` cookies. Despite being
"more modern," `localStorage`-stored tokens have genuinely worse
security properties for most web apps.

**Can I auto-login after password reset?** You can, but you shouldn't
in a teaching codebase. Making the user log in with the new password
confirms they typed what they meant and that session hijacking (if any)
loses its session.

**Should I ever use `app.use(cors())` with no options?** Only on a
true public API where every endpoint is already safely public. For
anything with cookies: no.

## Suggested exercises

- Add a `GET /api/me/sessions` endpoint that lists outstanding JWTs.
  Discuss why this is hard without a server-side session table and
  the tradeoff of statelessness.
- Add a login-attempt counter per user and lock an account after 10
  failures. Discuss the DoS implications (an attacker can lock out a
  real user if they know the email).
- Replace helmet with a hand-written middleware that sets each header
  individually. Compare line counts.
