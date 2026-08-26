/**
 * Auth toggle. Real Clerk sign-in is ON by default — the app works like the
 * iOS client: the user signs in, and the Clerk session token is sent as a
 * bearer on every API call so the backend returns that user's real data.
 *
 * Set VITE_DISABLE_AUTH="true" ONLY for a no-login UI preview (e.g. local
 * dev where the production Clerk key can't load). In that mode the backend
 * still requires a session, so account data will be empty/401.
 *
 * IMPORTANT: for sign-in to succeed, the app must be served from a domain your
 * Clerk production instance allows (cognivate.co or a registered subdomain).
 * Production Clerk keys are domain-locked and will NOT authenticate on
 * localhost or *.replit.app.
 */
export const AUTH_DISABLED = import.meta.env.VITE_DISABLE_AUTH === "true";
