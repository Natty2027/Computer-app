import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/SourceBadge";
import { cn } from "@/lib/utils";
import {
  SIMPLIFY_LEVELS,
  simplifyText,
  type SimplifyLevel,
  type SimplifyResult,
} from "@/lib/api/simplify";

/**
 * "Simplify" control — rewrites a passage into plainer language at a
 * chosen reading level via the /explain endpoint. Feature parity with
 * the mobile SimplifyButton. Renders a small trigger; the result and
 * level picker live in a popover so it drops in next to any text surface
 * (study sections, vocab, formulas, tutor replies) without restructuring
 * the page.
 */
export function SimplifyButton({
  envId,
  text,
  className,
  compact = false,
}: {
  envId: string;
  text: string;
  className?: string;
  /** Icon-only trigger (for dense rows like tutor replies). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<SimplifyLevel>("plain");

  const mutation = useMutation<SimplifyResult, Error, SimplifyLevel>({
    mutationFn: (lvl) => simplifyText({ envId, text, level: lvl }),
  });

  function run(lvl: SimplifyLevel) {
    setLevel(lvl);
    mutation.mutate(lvl);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    // Kick off the default level the first time it's opened so the user
    // sees a result immediately rather than an empty picker.
    if (next && !mutation.data && !mutation.isPending) run(level);
  }

  const disabled = !text?.trim();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          disabled={disabled}
          className={cn(
            "gap-1.5 text-muted-foreground hover:text-foreground",
            compact ? "h-7 w-7" : "h-7 px-2 text-xs",
            className,
          )}
          aria-label="Simplify this"
          data-testid="button-simplify"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {!compact && "Simplify"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {SIMPLIFY_LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => run(l.id)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                level === l.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
              data-testid={`button-simplify-level-${l.id}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {SIMPLIFY_LEVELS.find((l) => l.id === level)?.blurb}
        </p>

        <div className="max-h-72 overflow-y-auto rounded-lg bg-secondary/40 p-3 text-sm leading-relaxed">
          {mutation.isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Simplifying…
            </div>
          ) : mutation.isError ? (
            <p className="text-destructive">
              Couldn't simplify that right now. Try again in a moment.
            </p>
          ) : mutation.data ? (
            <p className="whitespace-pre-wrap">{mutation.data.explanation}</p>
          ) : (
            <p className="text-muted-foreground">Pick a level to simplify.</p>
          )}
        </div>

        {mutation.data?.sourceStatus && (
          <SourceBadge status={mutation.data.sourceStatus} />
        )}
      </PopoverContent>
    </Popover>
  );
}
