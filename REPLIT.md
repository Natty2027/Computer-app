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
5. **Clerk**: in the Clerk dashboard, add your Replit deploy domain
   (e.g. `your-app.replit.app`) to the allowed origins so sign-in loads there.
   The app sends the Clerk session as a bearer token, so cross-origin API calls
   to `cognivate.co` work; the API's CORS is already open.

## Notes

- Node 20 is pinned in `.replit` (Vite 7 needs ≥ 20.19).
- If you later host on a `cognivate.co` subdomain instead, no Clerk origin
  change is needed (same-site cookies).
- To point at a different backend, change `VITE_API_BASE_URL` and rebuild.
