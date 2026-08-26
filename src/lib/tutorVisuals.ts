/**
 * Tutor visuals are carried INSIDE the assistant message's markdown
 * `content` as fenced code blocks — no separate API field, so nothing
 * about the tutor endpoint's shape or persistence changes and clients
 * that don't understand the fences simply show the block as text.
 *
 * Two fence languages, matching the server contract in
 * `api-server/src/routes/ai.ts` (buildTutorVisualsRules):
 *   ```chart   → a JSON ChartSpec rendered with recharts, or a table
 *   ```mermaid → raw Mermaid source rendered as a diagram
 *
 * This module is pure: it turns a content string into an ordered list
 * of segments (prose text, chart specs, mermaid code) that the tutor
 * message renderer walks in order. Malformed chart JSON degrades to a
 * plain-text segment so a bad block never blanks the whole message.
 */

export type ChartSpec = {
  type: "bar" | "line" | "area" | "scatter" | "pie" | "table";
  title?: string;
  /** Property in each data row used for the x-axis / category / slice label. */
  xKey?: string;
  /** One or more numeric series (each `key` must exist in every data row). */
  series?: { key: string; name?: string }[];
  data?: Record<string, string | number>[];
  xLabel?: string;
  yLabel?: string;
  /** Table-only. */
  columns?: string[];
  rows?: (string | number)[][];
  caption?: string;
  /** Per-visual source-honesty tier (same union as SourceBadge). */
  source?: string;
};

export type TutorSegment =
  | { kind: "text"; text: string }
  | { kind: "chart"; spec: ChartSpec }
  | { kind: "mermaid"; code: string };

// Matches ```chart / ```mermaid fenced blocks. Non-greedy body; tolerates
// an optional trailing newline before the closing fence.
const FENCE_RE = /```(chart|mermaid)[ \t]*\r?\n([\s\S]*?)```/g;

function pushText(segments: TutorSegment[], text: string) {
  if (text.trim().length > 0) segments.push({ kind: "text", text: text.replace(/\s+$/, "") });
}

/**
 * Split tutor `content` into ordered renderable segments. Text outside
 * fences is preserved as-is (the renderer shows it as plain text).
 */
export function parseTutorContent(content: string): TutorSegment[] {
  if (!content) return [];
  const segments: TutorSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(content)) !== null) {
    pushText(segments, content.slice(lastIndex, m.index));
    lastIndex = FENCE_RE.lastIndex;
    const lang = m[1];
    const inner = m[2].trim();
    if (lang === "mermaid") {
      if (inner) segments.push({ kind: "mermaid", code: inner });
    } else {
      // chart
      const spec = safeParseChart(inner);
      if (spec) segments.push({ kind: "chart", spec });
      else pushText(segments, inner); // malformed → don't lose the info
    }
  }
  pushText(segments, content.slice(lastIndex));
  return segments;
}

function safeParseChart(json: string): ChartSpec | null {
  try {
    const obj = JSON.parse(json) as ChartSpec;
    if (!obj || typeof obj !== "object") return null;
    const types = ["bar", "line", "area", "scatter", "pie", "table"];
    if (!types.includes(obj.type)) return null;
    return obj;
  } catch {
    return null;
  }
}

/** True when content has at least one visual fence — cheap pre-check. */
export function hasTutorVisuals(content: string): boolean {
  FENCE_RE.lastIndex = 0;
  return FENCE_RE.test(content);
}
