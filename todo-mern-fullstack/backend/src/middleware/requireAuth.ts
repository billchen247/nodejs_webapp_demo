import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth/crypto.js";

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}

export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const token_from_cookie = readCookie(req.headers.cookie, "token");
    const token_from_custom_field = req.get("X-Auth-Token");
    const token = token_from_custom_field;
    if (!token) {
        res.status(401).json({ error: "missing Authentication token." });
        return;
    }
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
        res.status(401).json({ error: "Authentication required. wrong token" });
        return;
    }

    req.auth = { userId: payload.sub, email: payload.email, role: payload.role };
    next();
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
    if (!cookieHeader) return null;
    const prefix = `${name}=`;
    const cookie = cookieHeader.split(";").map((part) => part.trim())
        .find((part) => part.startsWith(prefix));
    if (!cookie) return null;

    try {
        return decodeURIComponent(cookie.slice(prefix.length));
    } catch {
        return null;
    }
}
