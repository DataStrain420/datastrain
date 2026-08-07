/**
 * Admin API calls share the same auth as patient calls now — a patient
 * whose email is in the backend's ADMIN_EMAILS allow-list gets admin
 * access via their normal DataStrain JWT. Keeping this named alias so
 * the admin pages don't need to be rewritten one-by-one.
 */
export { apiFetch as adminFetch } from "./api";
