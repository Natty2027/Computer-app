# Hosting on Replit

This app is a static Vite SPA that talks to the existing Cognivate API
(`https://cognivate.co`). Host it as a **Static Deployment**.

## Steps

1. **Import** this repo into Replit: Create → Import from GitHub →
   `Natty2027/Computer-app`.
2. **Add Secrets** (Tools → Secrets). These are build-time `VITE_` variables and
   must be set before deploying:
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsuY29nbml2YXRlLmNvJA`
   - `VITE_API_BASE_URL` = `https://cognivate.co`
3. **Run** (optional, dev preview): press Run — Vite serves on the webview.
4. **Deploy**: Deployments → **Static**. The build command is `npm run build`
   and the public directory is `dist` (already set in `.replit`). SPA fallback
   is configured so deep links don't 404.
5. **Clerk / custom domain — required for sign-in to work.**
   The app authenticates exactly like the iOS app (Clerk session → bearer token
   → real data). But your **production** Clerk key only loads on domains your
   Clerk instance approves. A bare `*.replit.app` URL will NOT authenticate.
   To make sign-in work:
   - Attach a **custom domain** to the Replit deployment — use a subdomain of
     your app domain, e.g. `app.cognivate.co` (Deployments → Settings → Link a
     domain; add the CNAME it gives you in your DNS).
   - In the **Clerk dashboard**, add that domain to the production instance
     (Domains → add `app.cognivate.co` as a satellite/allowed domain).
   - Redeploy. Sign-in and real data now work like iOS.

## Notes

- Node 20 is pinned in `.replit` (Vite 7 needs ≥ 20.19).
- `VITE_DISABLE_AUTH=true` gives a no-login UI preview, but the backend still
  requires a session so account data stays empty — use it only to look at the
  interface, not for real data.
- Simplest of all: host on `cognivate.co` itself (same origin as the API +
  Clerk) and auth "just works" with no dashboard changes.
- To point at a different backend, change `VITE_API_BASE_URL` and rebuild.
