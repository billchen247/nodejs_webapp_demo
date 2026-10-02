# Week 6 — Teaching Notes

## Learning goals

- Students can describe why passwords must be hashed, not encrypted or stored.
- Students can explain what a JWT is and how the server trusts it.
- Students can describe the trade-offs between cookies and `localStorage`.
- Students can register, log in, log out, and read `GET /api/auth/me`.
- Students can read a bcrypt hash in MongoDB Compass without panicking.

## Core concepts

### Authentication vs. authorization

| Term            | Question              | Example                 |
| --------------- | --------------------- | ----------------------- |
| Authentication  | Who are you?          | "I'm alice@example.com" |
| Authorization   | What may you do?      | "Alice can edit X"      |

Week 6 is pure authentication. Week 7 adds authorization and ownership.

### Password hashing with bcrypt

```js
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, hash);
```

- Hashing is one-way. You can't decrypt a password.
- Bcrypt is **deliberately slow** to make brute-forcing expensive.
- The salt is embedded in the hash — one call does both.

### JWT (JSON Web Token)

```
<base64 header>.<base64 payload>.<signature>
```

The signature is computed with `JWT_SECRET`. If anyone changes the
payload (`{ sub: userId }`), the signature won't verify. The server can
therefore trust the token's contents without a database lookup.

### Cookies vs. localStorage

| Property                | Cookie (HttpOnly) | localStorage |
| ----------------------- | ------------------ | ------------ |
| Readable by JavaScript  | No                 | Yes          |
| Sent automatically      | Yes (with CORS creds) | No        |
| Vulnerable to XSS       | Harder             | Easier       |
| Vulnerable to CSRF      | Possible           | No           |

We choose HttpOnly cookies with `SameSite=Lax` as the common best default.

### CORS + credentials

For cross-origin cookie-based auth:

- Browser: `fetch(url, { credentials: "include" })`
- Server:  `cors({ origin: CLIENT_URL, credentials: true })`

A missing one of these is the single most common bug.

### Not-yet-implemented

- Task ownership (Week 7).
- A reusable `authenticate` middleware (Week 7). We decode the cookie
  inline in `/me` this week to keep the lesson focused.
- Rate limiting, CSRF tokens, refresh tokens — Week 10.
- Admin role — Week 9.

## Common student questions

**Why does `/me` return 401 right after I log in on a fresh browser?**
The cookie was never sent. Check `credentials: "include"` on the client
and `credentials: true` on the server CORS config.

**Why is my `token` cookie missing from the Network tab?**
`HttpOnly` cookies are visible in Application → Cookies, not in the
response headers of fetch calls (the browser hides them).

**Can I store the JWT in `localStorage` instead?**
Technically yes, but any XSS vulnerability becomes a full account
takeover. HttpOnly cookies limit that blast radius. We prefer cookies.

**Why is `JWT_SECRET` so important?**
Anyone who knows it can forge valid tokens. Rotate it if it leaks.
