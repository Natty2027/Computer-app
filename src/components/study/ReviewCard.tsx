import { FlipCard } from "./FlipCard";
import type {
  DueItem,
  FormulaPayload,
  QuizQuestionPayload,
  VocabPayload,
} from "@/lib/api/review";

function KindLabel({ kind }: { kind: DueItem["kind"] }) {
  const label =
    kind === "vocab" ? "Vocabulary" : kind === "formula" ? "Formula" : "Quiz question";
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

/**
 * Renders one due review item as a flip card. Front shows the prompt
 * (term / formula name / question), back shows the answer. The parent
 * controls `flipped` and grading.
 */
export function ReviewCard({
  item,
  flipped,
  onFlip,
}: {
  item: DueItem;
  flipped: boolean;
  onFlip: () => void;
}) {
  let front: React.ReactNode;
  let back: React.ReactNode;

  if (item.kind === "vocab") {
    const p = item.payload as VocabPayload;
    front = (
      <>
        <KindLabel kind={item.kind} />
        <div className="text-2xl font-bold">{p.term}</div>
        <p className="text-sm text-muted-foreground">Tap to reveal the definition</p>
      </>
    );
    back = (
      <>
        <KindLabel kind={item.kind} />
        <p className="text-base leading-relaxed">{p.definition}</p>
        {p.example && (
          <p className="text-sm italic text-muted-foreground">e.g. {p.example}</p>
        )}
      </>
    );
  } else if (item.kind === "formula") {
    const p = item.payload as FormulaPayload;
    front = (
      <>
        <KindLabel kind={item.kind} />
        <div className="text-2xl font-bold">{p.name}</div>
        <p className="text-sm text-muted-foreground">Tap to reveal the formula</p>
      </>
    );
    back = (
      <>
        <KindLabel kind={item.kind} />
        <code className="rounded-lg bg-background/60 px-3 py-1.5 text-lg font-semibold">
          {p.expression}
        </code>
        <p className="text-sm leading-relaxed">{p.plainMeaning}</p>
        {p.whenToUse && (
          <p className="text-sm text-muted-foreground">When: {p.whenToUse}</p>
        )}
      </>
    );
  } else {
    const p = item.payload as QuizQuestionPayload;
    const correct =
      p.correctIndex != null && p.choices[p.correctIndex] != null
        ? p.choices[p.correctIndex]
        : null;
    front = (
      <>
        <KindLabel kind={item.kind} />
        <p className="text-lg font-semibold leading-snug">{p.prompt}</p>
        {p.choices.length > 0 && (
          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
            {p.choices.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </>
    );
    back = (
      <>
        <KindLabel kind={item.kind} />
        {correct ? (
          <div className="text-xl font-bold text-success">{correct}</div>
        ) : (
          <div className="text-base font-semibold">See explanation</div>
        )}
        {p.explanation && (
          <p className="text-sm leading-relaxed">{p.explanation}</p>
        )}
      </>
    );
  }

  return <FlipCard front={front} back={back} flipped={flipped} onFlip={onFlip} />;
}
