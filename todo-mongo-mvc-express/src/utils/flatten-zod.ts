/* ---------------------------------------------------------------------------
 * src/utils/flatten-zod.ts
 *
 * Squash a `ZodError` into a `{ [field]: message }` map. Templates render
 * one error per field under the input; keeping only the first message per
 * field matches that UX.
 *
 * A key of `_` is used for form-level errors that don't attach to any field
 * (e.g. "Email or password is incorrect" on the login form). Templates render
 * it as a banner above the fields.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

import type { ZodError } from "zod";

export function flattenZod(err: ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        if (!(key in out)) out[key] = issue.message;
    }
    return out;
}
