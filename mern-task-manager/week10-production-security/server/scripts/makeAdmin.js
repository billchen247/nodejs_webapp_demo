/**
 * @file scripts/makeAdmin.js
 * @author Bill Chen
 * @description Promote an existing user to admin.
 *   This is a *development* helper. Students should NEVER expose an API
 *   that lets a user set their own role.
 *
 *   Usage:
 *     npm run make-admin -- alice@example.com
 */

import mongoose from "mongoose";
import { User, ROLES } from "../src/models/User.js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run make-admin -- <email>");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Did you set it in .env?");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const normalized = email.trim().toLowerCase();
  const user = await User.findOneAndUpdate(
    { email: normalized },
    { role: ROLES.ADMIN },
    { new: true }
  );

  if (!user) {
    console.error(`No user with email ${normalized}`);
    process.exit(2);
  }

  console.log(`Promoted ${user.email} to ${user.role}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(99);
});
