import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Sparkles, Flame, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlipCard } from "@/components/study/FlipCard";
import { ReviewCard } from "@/components/study/ReviewCard";
import { cn } from "@/lib/utils";
import {
  useReviewDue,
  useGradeReview,
  type DueItem,
  type QuizQuestionPayload,
} from "@/lib/api/review";
import { useProgress } from "@/lib/api/progress";

type Stage = "warmup" | "check" | "spark" | "done";

export default function DailyPage() {
  const { data, isLoading } = useReviewDue();
  const grade = useGradeReview();
  const { data: progress } = useProgress();

  const all = useMemo<DueItem[]>(() => (data ?? []).flatMap((g) => g.items), [data]);

  // Partition the queue into the three stages.
  const warmup = useMemo(() => all.filter((i) => i.kind === "vocab" || i.kind === "formula").slice(0, 5), [all]);
  const check = useMemo(() => all.filter((i) => i.kind === "quiz_question").slice(0, 5), [all]);
  const spark = useMemo(() => all.find((i) => !warmup.includes(i) && !check.includes(i)) ?? all[0], [all, warmup, check]);

  const [stage, setStage] = useState<Stage>("warmup");
  const [step, setStep] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const totalSteps = warmup.length + check.length + 1;
  const doneSteps =
    stage === "warmup" ? step
    : stage === "check" ? warmup.length + step
    : stage === "spark" ? warmup.length + check.length
    : totalSteps;

  function advanceWarmup(g: "again" | "good") {
    const item = warmup[step];
    if (item) grade.mutate({ itemId: item.id, grade: g });
    setFlipped(false);
    if (step + 1 < warmup.length) setStep(step + 1);
    else { setStage(check.length > 0 ? "check" : "spark"); setStep(0); }
  }

  function advanceCheck(correct: boolean) {
    const item = check[step];
    if (item) grade.mutate({ itemId: item.id, grade: correct ? "good" : "again" });
    if (step + 1 < check.length) setStep(step + 1);
    else { setStage("spark"); setStep(0); }
  }

  if (isLoading) {
    return <Card><CardContent className="p-10 text-center text-muted-foreground">Loading your daily path…</CardContent></Card>;
  }
  if (all.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">
          Nothing to study yet. Upload materials or take a quiz to build your daily path.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
          <Sparkles className="h-6 w-6 text-brand" /> Daily path
        </h1>
        <p className="text-sm text-muted-foreground">A quick, guided study session in three parts.</p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.round((doneSteps / totalSteps) * 100)}%` }}
        />
      </div>

      {stage === "warmup" && warmup[step] && (
        <StageWrap label={`Warm up · ${step + 1}/${warmup.length}`}>
          <ReviewCard item={warmup[step]} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
          {flipped ? (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => advanceWarmup("again")} disabled={grade.isPending} className="h-11 bg-destructive text-destructive-foreground hover:opacity-90">Missed it</Button>
              <Button onClick={() => advanceWarmup("good")} disabled={grade.isPending} className="h-11 bg-success text-success-foreground hover:opacity-90">Got it</Button>
            </div>
          ) : (
            <Button onClick={() => setFlipped(true)} className="w-full bg-brand text-brand-foreground hover:opacity-90">Show answer</Button>
          )}
        </StageWrap>
      )}

      {stage === "check" && check[step] && (
        <StageWrap label={`Check · ${step + 1}/${check.length}`}>
          <CheckQuestion
            key={check[step].id}
            item={check[step]}
            onAnswer={advanceCheck}
          />
        </StageWrap>
      )}

      {stage === "spark" && spark && (
        <StageWrap label="Spark — concept of the day">
          <FlipCard
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            front={<div className="text-lg font-semibold">Tap to reveal today's spark ✨</div>}
            back={<SparkBack item={spark} />}
          />
          <Button onClick={() => setStage("done")} className="w-full gap-2 bg-brand text-brand-foreground hover:opacity-90">
            Finish <ArrowRight className="h-4 w-4" />
          </Button>
        </StageWrap>
      )}

      {stage === "done" && (
        <Card className="border-celebration/30 bg-celebration-soft">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Flame className="h-10 w-10 text-celebration" fill="currentColor" />
            <h2 className="text-xl font-bold">Daily path complete!</h2>
            {progress && (
              <p className="text-sm text-muted-foreground">
                {progress.dailyStreakCount}-day streak · Level {progress.level} · {progress.xpTotal} XP
              </p>
            )}
            <Button asChild className="bg-brand text-brand-foreground hover:opacity-90">
              <Link href="/today">Keep reviewing</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StageWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function CheckQuestion({ item, onAnswer }: { item: DueItem; onAnswer: (correct: boolean) => void }) {
  const p = item.payload as QuizQuestionPayload;
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-lg font-semibold leading-snug">{p.prompt}</p>
        <div className="space-y-2">
          {p.choices.map((c, i) => {
            const isCorrect = i === p.correctIndex;
            const state = !answered
              ? "idle"
              : i === picked && isCorrect ? "correct"
              : i === picked && !isCorrect ? "wrong"
              : isCorrect ? "correct" : "idle";
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  state === "idle" && "border-border hover:bg-secondary",
                  state === "correct" && "border-success bg-success-soft",
                  state === "wrong" && "border-destructive bg-destructive/10",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="space-y-3">
            {p.explanation && <p className="text-sm text-muted-foreground">{p.explanation}</p>}
            <Button
              onClick={() => onAnswer(picked === p.correctIndex)}
              className="w-full gap-2 bg-brand text-brand-foreground hover:opacity-90"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SparkBack({ item }: { item: DueItem }) {
  if (item.kind === "vocab") {
    const p = item.payload as { term: string; definition: string };
    return (
      <div className="space-y-2">
        <div className="text-xl font-bold">{p.term}</div>
        <p className="text-sm leading-relaxed">{p.definition}</p>
      </div>
    );
  }
  if (item.kind === "formula") {
    const p = item.payload as { name: string; plainMeaning: string };
    return (
      <div className="space-y-2">
        <div className="text-xl font-bold">{p.name}</div>
        <p className="text-sm leading-relaxed">{p.plainMeaning}</p>
      </div>
    );
  }
  const p = item.payload as QuizQuestionPayload;
  return <p className="text-base leading-relaxed">{p.prompt}</p>;
}
