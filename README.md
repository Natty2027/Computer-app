# Cognivate Web

Standalone web app for **Cognivate** — an upload-driven personal AI study tool.
This is the React + Vite web client extracted from the Cognivate monorepo so it
can be developed and deployed on its own. It talks to the existing Cognivate
backend API and uses Clerk for authentication.

## Stack

- **React 19** + **Vite 7** + **TypeScript**
- **TailwindCSS 4** + Radix UI (shadcn-style components)
- **Wouter** for routing, **TanStack React Query** for data
- **Clerk** (`@clerk/react`) for auth
- Generated API client (`vendor/api-client-react`) + upload helper
  (`vendor/object-storage-web`) — vendored from the monorepo, no build step

## Features

Library of study environments, per-environment dashboard, file uploads,
sections, vocabulary, formulas, quizzes (with a quiz player), practice,
highlights, and an AI tutor chat — all backed by the Cognivate API.

## Getting started

```bash
npm install
cp .env.example .env   # values are already filled with production defaults
npm run dev            # http://localhost:5173
```

Build for production:

```bash
npm run build          # outputs to dist/
npm run preview
```

## Configuration

All config is via environment variables (see `.env.example`):

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | no | `https://cognivate.co` | Backend API origin |
| `VITE_CLERK_PUBLISHABLE_KEY` | yes | (prod key in `.env.example`) | Clerk public key |
| `VITE_CLERK_PROXY_URL` | no | — | Clerk proxy for custom-domain setups |
| `BASE_PATH` | no | `/` | Asset base path (set for subpath hosting) |

The Clerk publishable key is a **public** key and is safe to commit/ship.

## Hosting note (auth & cross-origin)

The backend authenticates requests with the Clerk session. When this app is
served from the **same origin** as the API (e.g. `cognivate.co`), the browser
sends the Clerk session cookie automatically.

When hosted on a **different** domain (e.g. GitHub Pages, Vercel), cookies are
not sent cross-origin, so `src/main.tsx` also attaches the Clerk session token
as an `Authorization: Bearer` header via `setAuthTokenGetter`. For this to work
end to end, the Clerk instance must allow the deployment origin (add it as an
allowed origin / satellite domain in the Clerk dashboard). For the smoothest
result, host on `cognivate.co` or a subdomain of it.

## Layout

```
src/            app source (pages, components, hooks, lib)
vendor/         vendored monorepo packages (API client, uploader)
index.html      Vite entry
vite.config.ts  build config (aliases @ and @workspace/*)
```
