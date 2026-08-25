import { Component, type PropsWithChildren, type ReactNode } from "react";

type Props = PropsWithChildren<{
  /** Render prop for the fallback UI. Receives the error and a reset
   * callback that clears the boundary's error state so callers can offer
   * a "Try again" button without a full page reload. */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
}>;

type State = { error: Error | null };

/**
 * React error boundary for the web client tree. React only exposes error
 * boundaries via class lifecycle methods (`componentDidCatch` and the
 * static `getDerivedStateFromError`), so this has to be a class.
 *
 * Mounted at the root in `src/main.tsx` so any uncaught render-time error
 * anywhere in the tree shows the fallback instead of a blank white page —
 * the latter is what a user would otherwise see on a thrown error in
 * Production builds, because React tears down the tree.
 *
 * Async errors (rejected promises, network failures inside handlers) are
 * NOT caught here — React error boundaries only catch errors during
 * render, in lifecycle methods, and in constructors. Async failures are
 * the responsibility of the React Query error state and per-screen UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Surface to the console in addition to whatever telemetry the host
    // page might collect. Production deployments should pipe console.error
    // to a real reporter (Sentry, Bugsnag, etc).
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "#1f2937",
            background: "#f9fafb",
          }}
        >
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#4b5563", marginBottom: 16 }}>
              Cognivate hit an unexpected error. Try reloading the page. If it
              keeps happening, sign out and back in.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
