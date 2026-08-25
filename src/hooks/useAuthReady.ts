import { useAuth } from "@clerk/react";

import { AUTH_DISABLED } from "@/lib/authMode";

/**
 * True once Clerk has loaded and the user is signed in. Used to gate
 * React Query calls so we don't fire authenticated requests before the
 * session (and its bearer token) is available. Mirrors the mobile
 * `useAuthReady` hook.
 *
 * When auth is disabled we return true so queries still fire (they'll just
 * hit the API unauthenticated). AUTH_DISABLED is a build-time constant, so
 * the conditional hook call below never changes across renders.
 */
export function useAuthReady(): boolean {
  if (AUTH_DISABLED) return true;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && !!isSignedIn;
}
