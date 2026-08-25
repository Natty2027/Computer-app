import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import {
  BookOpen,
  LogOut,
  Library,
  Zap,
  Sparkles,
  CalendarDays,
  BarChart3,
  Trophy,
  Menu,
  X,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/react";

import { cn } from "@/lib/utils";
import { AUTH_DISABLED } from "@/lib/authMode";
import { StreakXpChip } from "@/components/study/StreakXpChip";

const NAV = [
  { href: "/", label: "Library", Icon: Library, exact: true },
  { href: "/today", label: "Today", Icon: Zap },
  { href: "/daily", label: "Daily", Icon: Sparkles },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
  { href: "/stats", label: "Stats", Icon: BarChart3 },
  { href: "/achievements", label: "Achievements", Icon: Trophy },
];

function isActive(location: string, href: string, exact?: boolean): boolean {
  if (exact) return location === href;
  return location === href || location.startsWith(`${href}/`);
}

// Clerk-bound account controls. Only mounted when auth is enabled — otherwise
// these hooks would run without a ClerkProvider. AUTH_DISABLED is a build-time
// constant so this component is either always or never mounted.
function AccountControls({ compact }: { compact?: boolean }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  return (
    <>
      {!compact && user && (
        <span
          data-testid="text-user-email"
          className="hidden max-w-[160px] truncate text-sm text-muted-foreground lg:inline"
          title={user.primaryEmailAddress?.emailAddress ?? ""}
        >
          {user.primaryEmailAddress?.emailAddress ?? user.username ?? ""}
        </span>
      )}
      <button
        type="button"
        onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
        data-testid="button-sign-out"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        aria-label="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" data-testid="link-home" className="flex items-center gap-2 group">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-[var(--shadow-brand)] transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight group-hover:opacity-80">
                Cognivate
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label, Icon, exact }) => {
              const active = isActive(location, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-brand"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <StreakXpChip className="hidden sm:flex" />
            {AUTH_DISABLED ? (
              <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:inline">
                Preview
              </span>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <AccountControls />
              </div>
            )}
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-border md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map(({ href, label, Icon, exact }) => {
                const active = isActive(location, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                      active ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <StreakXpChip />
                {AUTH_DISABLED ? (
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Preview</span>
                ) : (
                  <AccountControls compact />
                )}
              </div>
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
    </div>
  );
}
