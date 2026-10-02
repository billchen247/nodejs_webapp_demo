/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 09
 * File: server/src/scripts/seedAdmin.ts
 *
 * One-shot script: create (or promote) an admin user.
 *
 * Why a script?
 *   The public registration endpoint intentionally cannot create admins
 *   — otherwise anyone could promote themselves. So the first admin
 *   has to come in some other way. For a classroom app a tiny CLI is
 *   the simplest honest option. In production this is typically a
 *   migration or an infra-managed seed.
 *
 * Usage:
 *   # using env vars
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=supersecret1 \
 *     npm --prefix server run seed:admin
 *
 *   # or CLI args
 *   npm --prefix server run seed:admin -- admin@example.com supersecret1
 *
 * Behaviour:
 *   - If the email does not exist, we create a new admin user.
 *   - If the email already exists, we promote them to admin and leave
 *     the password alone. Idempotent either way.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase, disconnectFromDatabase } from "../config/database.js";
import { User, hashPassword } from "../models/User.js";

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? "";
  if (!uri) throw new Error("MONGODB_URI is not set. See .env.example.");

  const [cliEmail, cliPassword] = process.argv.slice(2);
  const email = (process.env.ADMIN_EMAIL ?? cliEmail ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? cliPassword ?? "";

  if (!email || !password) {
    throw new Error(
      "Both an email and a password are required. Pass them via ADMIN_EMAIL/ADMIN_PASSWORD or as CLI args.",
    );
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  await connectToDatabase(uri);

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === "admin") {
      // eslint-disable-next-line no-console
      console.log(`User ${email} is already an admin — nothing to do.`);
    } else {
      existing.role = "admin";
      await existing.save();
      // eslint-disable-next-line no-console
      console.log(`Promoted ${email} to admin.`);
    }
  } else {
    const passwordHash = await hashPassword(password);
    const admin = await User.create({ email, passwordHash, role: "admin", name: "" });
    // eslint-disable-next-line no-console
    console.log(`Created admin user ${admin.email} (id=${admin.id}).`);
  }

  await disconnectFromDatabase();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("seed:admin failed:", err);
  // Make sure we close the connection even on failure, or the Node
  // process will hang open on a dead script.
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
