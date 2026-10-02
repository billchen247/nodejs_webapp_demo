/**
 * @file tests/resetTokens.test.js
 * @author Bill Chen
 * @description Unit tests for src/utils/resetTokens.js — generation,
 *   hashing, and the "hash the raw token again to verify" pattern the
 *   auth controller relies on for password resets.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { generateResetToken, hashResetToken } from "../src/utils/resetTokens.js";

describe("generateResetToken", () => {
  it("returns a 64-character hex raw token (32 random bytes)", () => {
    const { raw } = generateResetToken();
    expect(raw).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns a hash that matches sha256(raw)", () => {
    const { raw, hash } = generateResetToken();
    const expected = crypto.createHash("sha256").update(raw).digest("hex");
    expect(hash).toBe(expected);
  });

  it("never stores the raw token anywhere resembling the hash", () => {
    const { raw, hash } = generateResetToken();
    expect(hash).not.toBe(raw);
  });

  it("sets an expiry roughly PASSWORD_RESET_TTL_MINUTES in the future", () => {
    const before = Date.now();
    const { expiresAt } = generateResetToken();
    const diffMinutes = (expiresAt.getTime() - before) / 60_000;
    // Default TTL is 30 minutes; allow generous slack for slow CI.
    expect(diffMinutes).toBeGreaterThan(25);
    expect(diffMinutes).toBeLessThanOrEqual(31);
  });

  it("generates a different token on every call", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("hashResetToken", () => {
  it("is deterministic for the same input", () => {
    const raw = "same-input-every-time";
    expect(hashResetToken(raw)).toBe(hashResetToken(raw));
  });

  it("matches the hash produced by generateResetToken for its own raw token", () => {
    const { raw, hash } = generateResetToken();
    expect(hashResetToken(raw)).toBe(hash);
  });

  it("produces different hashes for different inputs", () => {
    expect(hashResetToken("token-a")).not.toBe(hashResetToken("token-b"));
  });
});
