import assert from "node:assert/strict";
import { test } from "node:test";

process.env.JWT_SECRET = "unit-test-secret-with-at-least-32-bytes";

const { hashPassword, signToken, verifyPassword, verifyToken } = await import(
    "../src/auth/crypto.js"
);

test("password hashes verify only the original password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    assert.match(hash, /^scrypt\$16384\$8\$1\$/);
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
    assert.equal(await verifyPassword("incorrect password", hash), false);
});

test("password verification rejects malformed hashes", async () => {
    assert.equal(await verifyPassword("password", "not-a-scrypt-hash"), false);
    assert.equal(await verifyPassword("password", "scrypt$16384$8$1$salt$short"), false);
});

test("signed tokens verify and expose their claims", () => {
    const token = signToken("user-123", "user");
    const payload = verifyToken(token);

    assert.ok(payload);
    assert.equal(payload.sub, "user-123");
    assert.equal(payload.role, "user");
    assert.ok(payload.exp > payload.iat);
});

test("token verification rejects malformed and tampered tokens", () => {
    const token = signToken("user-123", "user");
    const [header, payload, signature] = token.split(".");
    assert.ok(header && payload && signature);
    const tamperedSignature = `${
        signature.startsWith("A") ? "B" : "A"
    }${signature.slice(1)}`;

    assert.equal(verifyToken("not-a-token"), null);
    assert.equal(verifyToken(`${header}.${payload}.${tamperedSignature}`), null);
});
