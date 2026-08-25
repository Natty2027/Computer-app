/**
 * Auth toggle. When auth is disabled, the app skips Clerk entirely: no
 * sign-in wall, no ClerkProvider, and Protected routes render directly.
 *
 * Defaults to DISABLED (preview mode) unless VITE_DISABLE_AUTH is explicitly
 * set to "false". Re-enable real sign-in by building with
 * VITE_DISABLE_AUTH=false (and a valid VITE_CLERK_PUBLISHABLE_KEY).
 *
 * NOTE: the backend still requires a Clerk session, so with auth disabled the
 * UI renders but account-scoped API calls (library, practice, tutor, etc.)
 * return 401 and show empty/error states. This is a preview of the interface,
 * not a working signed-out product.
 */
export const AUTH_DISABLED = import.meta.env.VITE_DISABLE_AUTH !== "false";
