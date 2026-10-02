/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 08
 * File: server/src/models/User.ts
 *
 * The User model.
 *
 * Three rules this schema enforces that pay off for the rest of the course:
 *   1. `email` is stored lowercased and uniquely indexed. The uniqueness is
 *      a database-level guarantee, not just an app-level `findOne` check.
 *   2. `passwordHash` is **never** returned by default (`select: false`).
 *      Any route that needs it must opt in with `.select("+passwordHash")`.
 *      This is a cheap belt-and-braces measure against accidentally
 *      serialising a user and leaking the hash.
 *   3. The `toJSON` transform drops the hash entirely, so even if a route
 *      *did* fetch it and respond with the user document, the field would
 *      not reach the wire.
 *
 * We store `passwordHash`, never the plain password. bcrypt hashes include
 * their own per-user salt, so there is no separate salt field.
 */
import bcrypt from "bcrypt";
import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

/**
 * bcrypt cost factor. 10 is a good default: well above the "trivial" bar
 * and still fast enough on commodity hardware for one login per second.
 * Raise it on production hardware if you can afford the latency.
 */
const BCRYPT_ROUNDS = 10;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      // A deliberately permissive regex: we are not trying to re-implement
      // RFC 5322, just catch obvious typos.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email looks invalid"],
    },
    passwordHash: {
      type: String,
      required: true,
      // Never return this field from a query unless the caller asks for it.
      select: false,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer"],
      default: "",
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

/**
 * Hash a plaintext password with bcrypt.
 *
 * This is a plain function (not a Mongoose middleware) so students can see
 * the hashing happen at the call site. A `pre("save")` hook would also
 * work but hides the operation.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Compare a plaintext password with a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const User = model("User", userSchema);
