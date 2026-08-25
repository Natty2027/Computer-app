import { Link } from "wouter";
import { Flame } from "lucide-react";

import { useProgress, useStreak } from "@/lib/api/progress";
import { ProgressRing } from "./ProgressRing";
import { cn } from "@/lib/utils";

/**
 * Compact streak + level/XP chip for the header. Shows the current daily
 * streak (🔥) and a small ring of progress toward the next level. Links
 * to Today. Renders nothing until progress data is available so it never
 * flashes a zeroed state.
 */
export function StreakXpChip({ className }: { className?: string }) {
  const { data: progress } = useProgress();
  const { data: streak } = useStreak();

  if (!progress) return null;

  const streakCount = streak?.current ?? progress.dailyStreakCount ?? 0;
  const denom = progress.currentLevelXp + progress.xpToNextLevel;
  const levelFraction = denom > 0 ? progress.currentLevelXp / denom : 0;

  return (
    <Link
      href="/today"
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-sm shadow-[var(--shadow-low)] transition-colors hover:bg-secondary",
        className,
      )}
      title={`${progress.levelTitle} · ${progress.xpTotal} XP`}
    >
      <span className="flex items-center gap-1 font-semibold">
        <Flame
          className={cn("h-4 w-4", streakCount > 0 ? "text-celebration" : "text-muted-foreground")}
          fill={streakCount > 0 ? "currentColor" : "none"}
        />
        {streakCount}
      </span>
      <span className="h-4 w-px bg-border" aria-hidden />
      <ProgressRing progress={levelFraction} size={26} stroke={3}>
        <span className="text-[10px] font-bold text-brand">{progress.level}</span>
      </ProgressRing>
    </Link>
  );
}
