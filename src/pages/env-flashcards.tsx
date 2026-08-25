import { useParams } from "wouter";
import { useMemo, useState } from "react";

import {
  useListVocabulary,
  getListVocabularyQueryKey,
  useListFormulas,
  getListFormulasQueryKey,
} from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlipCard } from "@/components/study/FlipCard";
import { ReviewCard } from "@/components/study/ReviewCard";
import { GradeButtons } from "@/components/study/GradeButtons";
import { useReviewDue, useGradeReview, type DueItem, type ReviewGrade } from "@/lib/api/review";
import { cn } from "@/lib/utils";

type Mode = "due" | "cram";
type CramCard = { id: string; front: string; back: string };

export default function EnvFlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useState<Mode>("due");

  return (
    <EnvLayout id={id}>
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          {(["due", "cram"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                mode === m ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "due" ? "Due (graded)" : "Cram"}
            </button>
          ))}
        </div>

        {mode === "due" ? <DueMode envId={id} /> : <CramMode envId={id} />}
      </div>
    </EnvLayout>
  );
}

function DueMode({ envId }: { envId: string }) {
  const { data, isLoading } = useReviewDue();
  const grade = useGradeReview();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const items = useMemo<DueItem[]>(() => {
    const group = (data ?? []).find((g) => g.envId === envId);
    return group?.items ?? [];
  }, [data, envId]);

  const current = items[idx];

  function onGrade(g: ReviewGrade) {
    if (!current) return;
    grade.mutate({ itemId: current.id, grade: g });
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  if (isLoading) return <Info>Loading due cards…</Info>;
  if (items.length === 0) return <Info>No cards due for this environment right now.</Info>;
  if (idx >= items.length) return <Info>Done — you've cleared the due cards for this subject. 🎉</Info>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{idx + 1} of {items.length}</div>
      <ReviewCard item={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      {flipped ? (
        <GradeButtons onGrade={onGrade} disabled={grade.isPending} />
      ) : (
        <Button onClick={() => setFlipped(true)} className="w-full bg-brand text-brand-foreground hover:opacity-90">Show answer</Button>
      )}
    </div>
  );
}

function CramMode({ envId }: { envId: string }) {
  const { data: vocab } = useListVocabulary(envId, { query: { queryKey: getListVocabularyQueryKey(envId) } });
  const { data: formulas } = useListFormulas(envId, { query: { queryKey: getListFormulasQueryKey(envId) } });

  const deck = useMemo<CramCard[]>(() => {
    const v: CramCard[] = (vocab ?? []).map((x: any) => ({ id: `v-${x.id}`, front: x.term, back: x.definition }));
    const f: CramCard[] = (formulas ?? []).map((x: any) => ({ id: `f-${x.id}`, front: x.name, back: `${x.expression}\n\n${x.plainMeaning}` }));
    return [...v, ...f];
  }, [vocab, formulas]);

  const [queue, setQueue] = useState<CramCard[] | null>(null);
  const [flipped, setFlipped] = useState(false);

  // Initialize the queue once the deck is available.
  const activeQueue = queue ?? deck;
  const current = activeQueue[0];

  function next(gotIt: boolean) {
    const [head, ...rest] = activeQueue;
    setFlipped(false);
    setQueue(gotIt ? rest : [...rest, head]); // recycle missed cards to the back
  }

  if (deck.length === 0) return <Info>No vocabulary or formulas to cram yet.</Info>;
  if (activeQueue.length === 0) return <Info>Cram complete — you got through every card. 🎉</Info>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{activeQueue.length} card{activeQueue.length === 1 ? "" : "s"} left</div>
      {current && (
        <FlipCard
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          front={<div className="text-2xl font-bold">{current.front}</div>}
          back={<div className="whitespace-pre-wrap text-base leading-relaxed">{current.back}</div>}
        />
      )}
      {flipped ? (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => next(false)} className="h-11 bg-warning text-warning-foreground hover:opacity-90">Again</Button>
          <Button onClick={() => next(true)} className="h-11 bg-success text-success-foreground hover:opacity-90">Got it</Button>
        </div>
      ) : (
        <Button onClick={() => setFlipped(true)} className="w-full bg-brand text-brand-foreground hover:opacity-90">Show answer</Button>
      )}
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return <Card><CardContent className="p-10 text-center text-muted-foreground">{children}</CardContent></Card>;
}
