import { useParams } from "wouter";
import { useState } from "react";
import {
  useGetQuiz,
  getGetQuizQueryKey,
  useSubmitQuizAttempt,
} from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EnvQuizTakePage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>();
  const { data, isLoading } = useGetQuiz(id, quizId, { query: { queryKey: getGetQuizQueryKey(id, quizId) } });
  const submit = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; results: any[] } | null>(null);

  if (isLoading || !data) {
    return <EnvLayout id={id}><p className="text-sm text-muted-foreground">Loading quiz…</p></EnvLayout>;
  }
  const resultByQ = new Map((result?.results ?? []).map((r) => [r.questionId, r]));

  return (
    <EnvLayout id={id}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-xl" data-testid="text-quiz-page-title">{data.title}</h2>
        {result && (
          <div className="rounded-full bg-secondary px-3 py-1 text-sm" data-testid="text-quiz-score">
            Score: <span className="font-semibold">{result.score} / {result.total}</span>
          </div>
        )}
      </div>
      <ol className="space-y-4">
        {data.questions.map((q, i) => {
          const r = resultByQ.get(q.id);
          return (
            <li key={q.id} data-testid={`question-${q.id}`}>
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-relaxed">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {q.prompt}
                    </p>
                    <SourceBadge status={q.sourceStatus} />
                  </div>
                  <div className="space-y-2">
                    {(q.choices ?? []).map((c: string, idx: number) => {
                      const selected = answers[q.id] === idx;
                      const isCorrect = r && idx === q.correctIndex;
                      const isWrongChoice = r && selected && !r.correct;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!!result}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                          className={cn(
                            "w-full text-left rounded-md border px-3 py-2 text-sm transition-colors",
                            !result && selected && "border-primary bg-primary/5",
                            !result && !selected && "border-border hover:bg-secondary/50",
                            result && isCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
                            result && isWrongChoice && "border-red-500 bg-red-50 dark:bg-red-900/30",
                            result && !isCorrect && !isWrongChoice && "border-border opacity-70",
                          )}
                          data-testid={`choice-${q.id}-${idx}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {result && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            {result && isWrongChoice && <XCircle className="h-4 w-4 text-red-600" />}
                            {c}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {r && (
                    <div className="rounded-md bg-secondary/50 p-3 space-y-2" data-testid={`feedback-${q.id}`}>
                      <SourceBadge status={r.feedbackStatus} />
                      <p className="text-sm">{r.feedback}</p>
                      <SourceCitations refs={q.sourceReferences} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
      {!result && (
        <div className="flex justify-end">
          <Button
            disabled={submit.isPending || Object.keys(answers).length !== data.questions.length}
            onClick={() => {
              const payload = {
                answers: data.questions.map((q) => ({ questionId: q.id, choiceIndex: answers[q.id] })),
              };
              submit.mutate({ id, quizId, data: payload }, {
                onSuccess: (r) => setResult(r),
              });
            }}
            className="gap-2"
            data-testid="button-submit-quiz"
          >
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit answers
          </Button>
        </div>
      )}
    </EnvLayout>
  );
}
