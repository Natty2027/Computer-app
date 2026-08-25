import { useAuth } from "@clerk/react";

/**
 * True once Clerk has loaded and the user is signed in. Used to gate
 * React Query calls so we don't fire authenticated requests before the
 * session (and its bearer token) is available. Mirrors the mobile
 * `useAuthReady` hook.
 */
export function useAuthReady(): boolean {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && !!isSignedIn;
}
