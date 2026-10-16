import {
    createHmac,
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { config } from "../config/index.js";

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;
const JWT_LIFETIME_SECONDS = 15 * 60;

interface JwtPayload {
    sub: string;
    role: string;
    iat: number;
    exp: number;
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const key = await scrypt(password, salt, PASSWORD_KEY_LENGTH, {
        N: 16_384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
    }) as Buffer;
    return `scrypt$16384$8$1$${salt}$${key.toString("base64url")}`;
}

export async function verifyPassword(
    password: string,
    encodedHash: string,
): Promise<boolean> {
    const [algorithm, n, r, p, salt, encodedKey] = encodedHash.split("$");
    if (
        algorithm !== "scrypt" ||
        n !== "16384" ||
        r !== "8" ||
        p !== "1" ||
        !salt ||
        !encodedKey
    ) {
        return false;
    }

    const expected = Buffer.from(encodedKey, "base64url");
    if (expected.length !== PASSWORD_KEY_LENGTH) return false;

    const actual = await scrypt(password, salt, PASSWORD_KEY_LENGTH, {
        N: 16_384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
    }) as Buffer;
    return timingSafeEqual(actual, expected);
}

export function signToken(userId: string, role: string): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = encodeBase64Url(JSON.stringify({
        sub: userId,
        role,
        iat: issuedAt,
        exp: issuedAt + JWT_LIFETIME_SECONDS,
    } satisfies JwtPayload));
    const unsigned = `${header}.${payload}`;
    return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token: string): JwtPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    if (!headerPart || !payloadPart || !signaturePart) return null;

    const expectedSignature = Buffer.from(sign(`${headerPart}.${payloadPart}`), "base64url");
    const receivedSignature = Buffer.from(signaturePart, "base64url");
    if (
        expectedSignature.length !== receivedSignature.length ||
        !timingSafeEqual(expectedSignature, receivedSignature)
    ) {
        return null;
    }

    try {
        const header: unknown = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
        const payload: unknown = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
        if (
            typeof header !== "object" ||
            header === null ||
            !("alg" in header) ||
            header.alg !== "HS256" ||
            typeof payload !== "object" ||
            payload === null ||
            !("sub" in payload) ||
            typeof payload.sub !== "string" ||
            !("role" in payload) ||
            typeof payload.role !== "string" ||
            !("iat" in payload) ||
            typeof payload.iat !== "number" ||
            !("exp" in payload) ||
            typeof payload.exp !== "number" ||
            payload.exp <= Math.floor(Date.now() / 1000)
        ) {
            return null;
        }
        return {
            sub: payload.sub,
            role: payload.role,
            iat: payload.iat,
            exp: payload.exp,
        };
    } catch {
        return null;
    }
}

export const authCookie = Object.freeze({
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: JWT_LIFETIME_SECONDS * 1000,
});

function sign(value: string): string {
    return createHmac("sha256", config.jwtSecret).update(value).digest("base64url");
}

function encodeBase64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}
