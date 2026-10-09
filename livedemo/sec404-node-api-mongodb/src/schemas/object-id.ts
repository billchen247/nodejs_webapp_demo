/* ---------------------------------------------------------------------------
 * src/schemas/object-id.ts
 *
 * Shared regex for MongoDB ObjectIds (24 lowercase hex chars, case-insensitive
 * on parse). Kept in its own file so multiple schema modules can import it
 * without one having to depend on another.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

export const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
