/* ---------------------------------------------------------------------------
 * src/models/user.ts
 *
 * The USER model. Owns identity + credentials:
 *
 *   * `name`         — display name, shown on the site
 *   * `email`        — unique, lowercased on save, used to log in
 *   * `passwordHash` — bcryptjs hash of the plaintext password. NEVER the
 *                      plaintext itself. Excluded from every query result by
 *                      default via `select: false`.
 *
 * Instance methods
 *   * `setPassword(plaintext)` — hashes and stores.
 *   * `verifyPassword(plain)`  — timing-safe compare via bcrypt.
 *
 * Static helpers
 *   * `UserModel.findByEmail(email)` — lowercases the input then queries.
 *
 * The `toJSON` / `toObject` transforms strip Mongo internals AND scrub
 * `passwordHash` — even if a template accidentally serialises the whole doc,
 * the hash never leaves the server.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import mongoose, { Schema, type InferSchemaType, type Model, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

// A "safe" view of a user — what templates and controllers may pass to views.
export interface UserView {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

// Cost factor for bcrypt. 10 is the library default; 12 is a common bump.
// Higher = slower = harder to brute-force. Keep it low in tests so the suite
// is fast; tests can override via env.
const BCRYPT_ROUNDS: number =
    process.env["NODE_ENV"] === "test" ? 4 : Number(process.env["BCRYPT_ROUNDS"] ?? 10);

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [1, "Name cannot be empty"],
            maxlength: [80, "Name cannot exceed 80 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            unique: true,
            maxlength: [200, "Email is too long"],
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email format looks wrong"],
        },
        passwordHash: {
            type: String,
            required: true,
            // NEVER return this by default. Controllers that need it (login)
            // must explicitly `.select("+passwordHash")`.
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = String(ret["_id"]);
                delete ret["_id"];
                delete ret["passwordHash"];
                return ret;
            },
        },
        toObject: {
            versionKey: false,
            transform: (_doc, ret: Record<string, unknown>) => {
                ret["id"] = String(ret["_id"]);
                delete ret["_id"];
                delete ret["passwordHash"];
                return ret;
            },
        },
    }
);

// `unique: true` on the schema field above already creates a unique index on
// `email`; no explicit `userSchema.index(...)` needed. (An extra one would
// trigger Mongoose's "duplicate schema index" warning at load time.)

/* --- instance methods -------------------------------------------------- */

userSchema.methods["setPassword"] = async function (plaintext: string): Promise<void> {
    this["passwordHash"] = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);
};

userSchema.methods["verifyPassword"] = async function (plaintext: string): Promise<boolean> {
    const hash = this["passwordHash"] as string | undefined;
    if (!hash) return false;
    return bcrypt.compare(plaintext, hash);
};

/* --- static methods ---------------------------------------------------- */

userSchema.statics["findByEmail"] = function (email: string) {
    return this["findOne"]({ email: email.trim().toLowerCase() });
};

/* --- typed model exports ---------------------------------------------- */

export type UserRaw = InferSchemaType<typeof userSchema>;

export interface UserMethods {
    setPassword(plaintext: string): Promise<void>;
    verifyPassword(plaintext: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<UserRaw, UserMethods>;

export interface UserStatics extends Model<UserRaw, {}, UserMethods> {
    findByEmail(email: string): mongoose.QueryWithHelpers<UserDoc | null, UserDoc>;
}

export const UserModel: UserStatics =
    (mongoose.models["User"] as UserStatics) ??
    mongoose.model<UserRaw, UserStatics>("User", userSchema);
