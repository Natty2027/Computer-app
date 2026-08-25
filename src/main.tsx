import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Point the generated API client at the backend. When the web app is served
// from the same origin as the API this can stay unset (relative /api paths).
// For a standalone deployment on a different host, set VITE_API_BASE_URL to the
// backend origin (defaults to the production API).
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://cognivate.co";
setBaseUrl(apiBaseUrl);

// When the web app is hosted on a DIFFERENT domain than the API, the browser
// will not send Clerk's session cookies cross-origin. Attach the Clerk session
// token as a bearer instead so authenticated requests work from any host. This
// is harmless on same-origin deployments (cookies already carry the session).
setAuthTokenGetter(async () => {
  const clerk = (
    window as unknown as {
      Clerk?: { session?: { getToken: () => Promise<string | null> } };
    }
  ).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
