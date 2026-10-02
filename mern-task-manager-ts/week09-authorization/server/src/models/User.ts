/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/models/User.ts
 *
 * New in Week 9: a `role` field — "user" or "admin".
 *
 * Three rules this schema enforces that pay off for the rest of the course:
 *   1. `email` is stored lowercased and uniquely indexed. The uniqueness is
 *      a database-level guarantee, not just an app-level `findOne` check.
 *   2. `passwordHash` is **never** returned by default (`select: false`).
 *      Any route that needs it must opt in with `.select("+passwordHash")`.
 *   3. `role` is an enum pinned to "user" by default. The register endpoint
 *      *never* lets the client set this — promoting a user to admin is a
 *      separate operation only an existing admin can perform.
 *
 * We store `passwordHash`, never the plain password. bcrypt hashes include
 * their own per-user salt, so there is no separate salt field.
 */
import bcrypt from "bcrypt";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const BCRYPT_ROUNDS = 10;

/** The complete list of roles the app knows about. Keep it short — real
 *  apps regret adding half a dozen roles that nobody can describe. */
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
      // Default to the least-privileged role. New registrations always
      // start here — self-promotion to admin is impossible by design.
      default: "user",
      required: true,
      index: true,
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
        return ret;
      },
    },
  },
);

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserAttrs>;

/** Hash a plaintext password with bcrypt. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Compare a plaintext password with a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const User = model("User", userSchema);
