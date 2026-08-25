import { cn } from "@/lib/utils";
import { BookOpen, Sparkles, Lightbulb, MessageSquare, AlertCircle, FileText } from "lucide-react";

export type SourceStatus =
  | "from_source"
  | "mostly_from_source"
  | "ai_filled_gap"
  | "ai_generated_example"
  | "ai_generated_explanation"
  | "not_in_source"
  | string
  | null
  | undefined;

const META: Record<string, { label: string; cls: string; Icon: typeof BookOpen }> = {
  from_source: {
    label: "From your material",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
    Icon: BookOpen,
  },
  mostly_from_source: {
    label: "Mostly from your material",
    cls: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-800",
    Icon: FileText,
  },
  ai_filled_gap: {
    label: "AI-filled gap",
    cls: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
    Icon: Sparkles,
  },
  ai_generated_example: {
    label: "AI example",
    cls: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800",
    Icon: Lightbulb,
  },
  ai_generated_explanation: {
    label: "AI explanation",
    cls: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
    Icon: MessageSquare,
  },
  not_in_source: {
    label: "Not in your upload",
    cls: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700",
    Icon: AlertCircle,
  },
  unknown: {
    label: "Source unknown",
    cls: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800",
    Icon: AlertCircle,
  },
};

export function SourceBadge({ status, className }: { status: SourceStatus; className?: string }) {
  const key = status == null ? "unknown" : String(status);
  const m = META[key] ?? META.unknown;
  const Icon = m.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        m.cls,
        className,
      )}
      data-testid={`badge-source-${status ?? "unknown"}`}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

export interface SourceRef {
  fileId?: string | null;
  fileName: string;
  location?: string | null;
  excerpt?: string | null;
}

export function SourceCitations({ refs, className }: { refs?: SourceRef[] | null; className?: string }) {
  if (!refs || refs.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {refs.slice(0, 4).map((r, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground border border-border"
          title={r.excerpt ?? undefined}
          data-testid={`pill-citation-${i}`}
        >
          <FileText className="h-3 w-3" />
          <span className="truncate max-w-[160px]">{r.fileName}</span>
          {r.location ? <span className="opacity-70">· {r.location}</span> : null}
        </span>
      ))}
    </div>
  );
}
