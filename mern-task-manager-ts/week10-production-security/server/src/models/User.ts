/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 10
 * File: server/src/models/User.ts
 *
 * New in Week 10:
 *   - Password-reset fields: `resetTokenHash` + `resetTokenExpiresAt`.
 *     Both are `select: false` so a casual `User.findOne` cannot leak
 *     them. We store a *hash* of the token, not the token itself —
 *     treating a reset token like a password avoids the "someone with
 *     DB read access can hijack any account" blast radius.
 *
 * Carried over from Week 9:
 *   - `role` with safe default and enum.
 *   - `passwordHash` with `select: false` and `toJSON` scrubbing.
 */
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const BCRYPT_ROUNDS = 10;

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email looks invalid"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer"],
      default: "",
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be 'user' or 'admin'",
      },
      default: "user",
      required: true,
      index: true,
    },
    // Password reset — hashed, so a DB leak does not immediately
    // compromise anyone with an active reset token.
    resetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string } | undefined)?.toString?.() ?? ret.id;
        delete ret._id;
        delete ret.passwordHash;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        return ret;
      },
    },
  },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttrs>;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Create a reset token. Returns the plaintext (for the email) and the
 * hash (for persistence). Use `crypto.randomBytes` — this is a secret,
 * not a UUID. Hex is URL-safe without percent-encoding.
 */
export function createResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashResetToken(token);
  return { token, hash };
}

/** Hash a reset token the same way regardless of who is doing it. */
export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const User = model("User", userSchema);
