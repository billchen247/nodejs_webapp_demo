import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authCookie, hashPassword, signToken, verifyPassword } from "../auth/crypto.js";
import { UserModel, type UserDoc } from "../models/User.js";

const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required.").max(100),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

const loginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address.").max(254),
    password: z.string().min(1, "Password is required.").max(128),
});

export async function register(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const input = registerSchema.parse(req.body);
        const email = input.email.toLowerCase();
        if (await UserModel.exists({ email })) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }

        const user = await UserModel.create({
            name: input.name,
            email,
            passwordHash: await hashPassword(input.password),
            role: "student",
        });
        setAuthCookie(res, user);
        res.status(201).json({ user: toPublicUser(user) });
    } catch (err) {
        if (isDuplicateEmailError(err)) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        next(err);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const input = loginSchema.parse(req.body);
        const user = await UserModel.findOne({ email: input.email.toLowerCase() })
            .select("+passwordHash")
            .exec();
        if (!user ){
            res.status(401).json({ error: "Invalid email ." });
            return;
        }
        if (!(await verifyPassword(input.password, user.passwordHash))) {
            res.status(401).json({ error: "Invalid password." });
            return;
        }

        setAuthCookie(res, user);
        res.json({ user: toPublicUser(user) });
    } catch (err) {
        next(err);
    }
}

export function logout(_req: Request, res: Response): void {
    res.clearCookie("token", {
        httpOnly: authCookie.httpOnly,
        secure: authCookie.secure,
        sameSite: authCookie.sameSite,
        path: authCookie.path,
    });
    res.json({ message: "Logged out." });
}

export function getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ error: "Authentication required." });
        return;
    }

    void UserModel.findById(userId)
        .select("-passwordHash")
        .exec()
        .then((user) => {
            if (!user) {
                res.status(401).json({ error: "Authentication required." });
                return;
            }
            res.json({ user: toPublicUser(user) });
        })
        .catch(next);
}

function setAuthCookie(res: Response, user: UserDoc): void {
    res.cookie("token", signToken(String(user._id), user.role), authCookie);
}

function toPublicUser(user: UserDoc) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
    };
}

function isDuplicateEmailError(err: unknown): boolean {
    return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}
