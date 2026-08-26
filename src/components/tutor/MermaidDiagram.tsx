import { useEffect, useRef, useState } from "react";

/**
 * Renders a Mermaid diagram from raw source. Mermaid is heavy (~parser +
 * layout engine), so it's dynamically imported on first use to keep it
 * out of the initial bundle. Each diagram renders to an isolated SVG via
 * a unique id. Invalid Mermaid source shows a small note plus the raw
 * code rather than throwing.
 */

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
let idCounter = 0;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict", // no click handlers / raw HTML from model output
        theme: "default",
        fontFamily: "inherit",
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const idRef = useRef(`tutor-mermaid-${idCounter++}`);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(false);
    loadMermaid()
      .then((mermaid) => mermaid.render(idRef.current, code))
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="space-y-1">
        <p className="text-xs italic text-muted-foreground">
          (This diagram couldn't be rendered.)
        </p>
        <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-2 text-xs">
          {code}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      // eslint-disable-next-line react/no-danger -- mermaid output, securityLevel:'strict'
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
