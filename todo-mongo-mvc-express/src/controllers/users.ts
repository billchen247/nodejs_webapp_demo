/* ---------------------------------------------------------------------------
 * src/controllers/users.ts
 *
 * User profile actions:
 *
 *   * GET  /users            — directory: everyone who's signed up
 *   * GET  /users/:id        — public-ish profile (name + projects they own)
 *   * GET  /users/me/edit    — edit MY profile (self-service only)
 *   * PUT  /users/me         — update MY name/email
 *   * POST /users/me/password — change MY password
 *
 * Deliberately, there's no admin flow — no user can edit or delete another.
 * That keeps the demo focused on ownership, not roles.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/user.js";
import { ProjectModel } from "../models/project.js";
import { updateProfileSchema, changePasswordSchema } from "../schemas/user.js";
import { HttpError } from "../utils/http-error.js";
import { flattenZod } from "../utils/flatten-zod.js";
import { assertUser } from "../middleware/auth.js";

/* --- GET /users ------------------------------------------------------- */
export const listUsers: RequestHandler = async (_req, res) => {
    const users = await UserModel.find({}).sort({ name: 1 }).lean();
    res.render("users/index", {
        title: "Users",
        users: users.map((u) => ({
            id: String(u._id),
            name: u.name,
            email: u.email,
            createdAt: u.createdAt,
        })),
    });
};

/* --- GET /users/:id --------------------------------------------------- */
export const showUser: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const id = String(req.params["id"]);
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid User ID");

    const user = await UserModel.findById(id);
    if (!user) throw new HttpError(404, "User not found");

    const ownedProjects = await ProjectModel.find({ owner: user._id })
        .sort({ createdAt: -1 })
        .lean();

    res.render("users/show", {
        title: user.name,
        user: user.toJSON(),
        isSelf: String(user._id) === String(currentUser._id),
        projects: ownedProjects.map((p) => ({
            id: String(p._id),
            name: p.name,
            description: p.description,
        })),
    });
};

/* --- GET /users/me/edit ---------------------------------------------- */
export const editMeForm: RequestHandler = (req, res) => {
    const currentUser = assertUser(req);
    res.render("users/edit", {
        title: "Edit profile",
        values: { name: currentUser.name, email: currentUser.email },
        passwordValues: {},
        errors: {},
        passwordErrors: {},
    });
};

/* --- PUT /users/me ---------------------------------------------------- */
export const updateMe: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).render("users/edit", {
            title: "Edit profile",
            values: req.body ?? {},
            passwordValues: {},
            errors: flattenZod(parsed.error),
            passwordErrors: {},
        });
        return;
    }

    // If they're changing email, make sure the new one isn't taken by someone
    // else. Their own current email is fine.
    if (parsed.data.email !== currentUser.email) {
        const clash = await UserModel.findByEmail(parsed.data.email);
        if (clash && String(clash._id) !== String(currentUser._id)) {
            res.status(400).render("users/edit", {
                title: "Edit profile",
                values: req.body ?? {},
                passwordValues: {},
                errors: { email: "Another account already uses this email" },
                passwordErrors: {},
            });
            return;
        }
    }

    currentUser.name = parsed.data.name;
    currentUser.email = parsed.data.email;
    await currentUser.save();

    req.session.flash = { type: "success", message: "Profile updated" };
    res.redirect(`/users/${currentUser._id}`);
};

/* --- POST /users/me/password ----------------------------------------- */
export const changeMyPassword: RequestHandler = async (req, res) => {
    const currentUser = assertUser(req);

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).render("users/edit", {
            title: "Edit profile",
            values: { name: currentUser.name, email: currentUser.email },
            passwordValues: {},
            errors: {},
            passwordErrors: flattenZod(parsed.error),
        });
        return;
    }

    // Re-load with the hash so we can verify.
    const withHash = await UserModel.findById(currentUser._id).select("+passwordHash");
    if (!withHash) throw new HttpError(404, "User not found");
    const ok = await (withHash as any).verifyPassword(parsed.data.currentPassword);
    if (!ok) {
        res.status(400).render("users/edit", {
            title: "Edit profile",
            values: { name: currentUser.name, email: currentUser.email },
            passwordValues: {},
            errors: {},
            passwordErrors: { currentPassword: "Current password is incorrect" },
        });
        return;
    }

    await (withHash as any).setPassword(parsed.data.newPassword);
    await withHash.save();

    req.session.flash = { type: "success", message: "Password changed" };
    res.redirect(`/users/${currentUser._id}`);
};
