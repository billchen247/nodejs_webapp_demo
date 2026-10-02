/**
 * @file src/models/User.js
 * @author Bill Chen
 * @description User model.
 *   Important rules:
 *     - We never store the plaintext password. Only `passwordHash`.
 *     - Email is normalized (lowercased + trimmed) and unique.
 *     - A convenience `.toSafeJSON()` strips sensitive fields before sending.
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      // minimal shape check; real validation happens in the controller
      match: [/^\S+@\S+\.\S+$/, "email is invalid"],
    },
    passwordHash: {
      type: String,
      required: true,
      // never return this field by default when a query runs .select(...)
      select: false,
    },
  },
  { timestamps: true }
);

// Returns a user object safe for sending to the client.
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
