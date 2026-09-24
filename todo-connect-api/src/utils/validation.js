/* ---------------------------------------------------------------------------
 * src/utils/validation.js
 *
 * Tiny input-validation helpers used by the controllers. Kept in their own
 * file so the controllers can stay focused on request handling instead of
 * regexes and type checks.
 * -------------------------------------------------------------------------*/

// Convert a URL path segment like "42" into the number 42, rejecting anything
// that isn't a positive integer. URL segments are always strings, so this
// step is unavoidable — Express's `:id` shortcut still returns a string, and
// most Express apps do the same conversion inside their handler.
//
// Returns null (not undefined, not throwing) so the caller can turn a bad id
// into a clean 400 Bad Request response.
function parseTodoId(idString) {
    if (!/^\d+$/.test(idString)) return null;
    const n = Number(idString);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
}

module.exports = { parseTodoId };
