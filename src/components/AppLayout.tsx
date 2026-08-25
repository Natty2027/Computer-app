import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { BookOpen, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" data-testid="link-home" className="flex items-center gap-2 group">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight group-hover:opacity-80">
              Cognivate
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {location !== "/" && (
              <Link href="/" data-testid="link-library" className="text-sm text-muted-foreground hover:text-foreground">
                My library
              </Link>
            )}
            {user && (
              <span
                data-testid="text-user-email"
                className="hidden sm:inline text-sm text-muted-foreground max-w-[180px] truncate"
                title={user.primaryEmailAddress?.emailAddress ?? ""}
              >
                {user.primaryEmailAddress?.emailAddress ?? user.username ?? ""}
              </span>
            )}
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
              data-testid="button-sign-out"
              className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-border hover:bg-muted"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
    </div>
  );
}
