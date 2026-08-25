import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Flame } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ReviewCard } from "@/components/study/ReviewCard";
import { GradeButtons } from "@/components/study/GradeButtons";
import { ProgressRing } from "@/components/study/ProgressRing";
import { useReviewDue, useGradeReview, type DueItem, type ReviewGrade } from "@/lib/api/review";
import { useProgress } from "@/lib/api/progress";

const VERIFIED_TIERS = new Set(["from_source", "mostly_from_source"]);

export default function TodayPage() {
  const { data, isLoading } = useReviewDue();
  const grade = useGradeReview();
  const { data: progress } = useProgress();

  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const items = useMemo<DueItem[]>(() => {
    const all = (data ?? []).flatMap((g) => g.items);
    return verifiedOnly ? all.filter((it) => VERIFIED_TIERS.has(it.sourceTier)) : all;
  }, [data, verifiedOnly]);

  const current = items[idx];
  const total = items.length;

  function onGrade(g: ReviewGrade) {
    if (!current) return;
    grade.mutate({ itemId: current.id, grade: g });
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  const denom = progress ? progress.currentLevelXp + progress.xpToNextLevel : 0;
  const levelFraction = denom > 0 ? (progress!.currentLevelXp) / denom : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Today</h1>
          <p className="text-sm text-muted-foreground">Your spaced-repetition review queue.</p>
        </div>
        {progress && (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-[var(--shadow-low)]">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-celebration" fill="currentColor" />
              <div>
                <div className="text-lg font-bold leading-none">{progress.dailyStreakCount}</div>
                <div className="text-xs text-muted-foreground">day streak</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <ProgressRing progress={levelFraction} size={40} stroke={4}>
              <span className="text-xs font-bold text-brand">{progress.level}</span>
            </ProgressRing>
            <div>
              <div className="text-sm font-semibold leading-none">{progress.levelTitle}</div>
              <div className="text-xs text-muted-foreground">{progress.xpTotal} XP</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total > 0 && idx < total ? `${idx + 1} of ${total}` : `${total} due`}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={verifiedOnly} onCheckedChange={(v) => { setVerifiedOnly(v); setIdx(0); setFlipped(false); }} />
          Verified only
        </label>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Loading your queue…</CardContent></Card>
      ) : total === 0 ? (
        <EmptyState message="Nothing due right now. Upload materials or take a quiz to seed your review queue." />
      ) : idx >= total ? (
        <Card className="border-success/30 bg-success-soft">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <h2 className="text-xl font-bold">All caught up!</h2>
            <p className="text-sm text-muted-foreground">You've cleared today's review queue. 🎉</p>
            <Button asChild className="bg-brand text-brand-foreground hover:opacity-90">
              <Link href="/">Back to library</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {current && (
            <ReviewCard item={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
          )}
          {flipped ? (
            <GradeButtons onGrade={onGrade} disabled={grade.isPending} />
          ) : (
            <Button
              onClick={() => setFlipped(true)}
              className="w-full bg-brand text-brand-foreground hover:opacity-90"
            >
              Show answer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-10 text-center text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
