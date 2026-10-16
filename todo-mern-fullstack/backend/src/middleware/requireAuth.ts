import type { Request, Response, NextFunction } from "express";
import { signToken, verifyToken } from "../auth/crypto.js";

declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
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
    const token = readCookie(req.headers.cookie, "token");
    if (!token) {
        res.status(401).json({ error: "missing Authentication." });
        return;
    }
    const payload = token ? verifyToken(token) : null;
    if (!payload) {
        res.status(401).json({ error: "Authentication required. wrong token" });
        return;
    }

    req.auth = { userId: payload.sub, role: payload.role };
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
