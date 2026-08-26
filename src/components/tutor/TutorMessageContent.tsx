import { parseTutorContent } from "@/lib/tutorVisuals";
import { SourceBadge } from "@/components/SourceBadge";
import { TutorChart } from "./TutorChart";
import { MermaidDiagram } from "./MermaidDiagram";

/**
 * Renders an assistant tutor message: prose text interleaved with any
 * embedded visuals (charts, tables, diagrams). Falls back to plain text
 * when the message has no visuals, so ordinary replies look exactly as
 * before. Each visual is boxed with an optional title, caption, and its
 * own source-honesty badge.
 */
export function TutorMessageContent({ content }: { content: string }) {
  const segments = parseTutorContent(content);

  return (
    <div className="space-y-3">
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          return (
            <p key={i} className="whitespace-pre-wrap">
              {seg.text}
            </p>
          );
        }
        if (seg.kind === "mermaid") {
          return (
            <figure key={i} className="rounded-xl border border-border bg-card p-3">
              <MermaidDiagram code={seg.code} />
            </figure>
          );
        }
        // chart / table
        const { spec } = seg;
        return (
          <figure key={i} className="space-y-1.5 rounded-xl border border-border bg-card p-3">
            {spec.title && <figcaption className="text-sm font-semibold">{spec.title}</figcaption>}
            <TutorChart spec={spec} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {spec.caption ? (
                <span className="text-xs text-muted-foreground">{spec.caption}</span>
              ) : (
                <span />
              )}
              {spec.source && <SourceBadge status={spec.source} />}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
