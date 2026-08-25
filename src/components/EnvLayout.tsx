import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { useGetEnvironment, getGetEnvironmentQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  ListTree,
  GraduationCap,
  Calculator,
  Sparkles,
  PencilRuler,
  MessagesSquare,
  Highlighter,
} from "lucide-react";

const TABS = [
  { href: "", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/files", label: "Materials", Icon: FileText },
  { href: "/sections", label: "Outline", Icon: ListTree },
  { href: "/vocabulary", label: "Vocabulary", Icon: GraduationCap },
  { href: "/formulas", label: "Formulas", Icon: Calculator },
  { href: "/quizzes", label: "Quizzes", Icon: Sparkles },
  { href: "/practice", label: "Practice", Icon: PencilRuler },
  { href: "/tutor", label: "Tutor", Icon: MessagesSquare },
  { href: "/highlights", label: "Highlights", Icon: Highlighter },
];

export function EnvLayout({ id, children }: { id: string; children: ReactNode }) {
  const [location] = useLocation();
  const { data: env } = useGetEnvironment(id, {
    query: {
      queryKey: getGetEnvironmentQueryKey(id),
      refetchInterval: (q) => {
        const d: any = q.state.data;
        return d && (d.status === "analyzing" || d.status === "uploaded") ? 3000 : false;
      },
    },
  });
  const base = `/env/${id}`;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" data-testid="link-back-library" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← My library
        </Link>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight" data-testid="text-env-title">
            {env?.title ?? "Loading…"}
          </h1>
          {env?.detectedSubject && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground" data-testid="text-env-subject">
              {env.detectedSubject}
            </span>
          )}
          {env?.status && env.status !== "ready" && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs text-amber-900 dark:text-amber-200" data-testid="text-env-status">
              {env.status === "analyzing" ? "Analyzing your material…" : env.status}
            </span>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 no-scrollbar">
        {TABS.map(({ href, label, Icon }) => {
          const full = `${base}${href}`;
          const active =
            href === "" ? location === base : location === full || location.startsWith(`${full}/`);
          return (
            <Link
              key={href}
              href={full}
              data-testid={`tab-${label.toLowerCase()}`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
