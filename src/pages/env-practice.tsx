import { useParams, useSearch } from "wouter";
import { useMemo, useState } from "react";
import {
  Loader2,
  PencilRuler,
  Lightbulb,
  Check,
  X,
  SkipForward,
  Trophy,
  RotateCcw,
} from "lucide-react";

import { useListSections, getListSectionsQueryKey } from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useStartPractice,
  useGradeStep,
  useRequestHint,
  useCompleteAttempt,
  useGetPracticeQuota,
  type InteractivePracticeProblem,
  type PracticeProblemTypeRequest,
  type PracticeProblemFormat,
  type StepReveal,
  type CompleteAttemptResponse,
} from "@/lib/api/practice";
import { isDailyLimitError } from "@/lib/api/premium";

const PROBLEM_TYPES: { value: PracticeProblemTypeRequest; label: string }[] = [
  { value: "auto", label: "Adaptive" },
  { value: "calculation", label: "Calculation" },
  { value: "conceptual", label: "Conceptual" },
  { value: "application", label: "Application" },
];

const FORMAT_LABELS: Record<PracticeProblemFormat, string> = {
  calculation: "Calculation",
  conceptual: "Conceptual",
  application: "Application",
};

type RowStatus =
  | "correct"
  | "nearly_correct"
  | "skipped"
  | "revealed"
  | "locked"
  | "incorrect";

type RowState = {
  status?: RowStatus;
  userAnswer?: string;
  expected?: string | null;
  hint?: string | null;
  reveal?: StepReveal | null;
  nudge?: string | null;
  attemptCount?: number;
};

const RESOLVED: RowStatus[] = ["correct", "nearly_correct", "skipped", "revealed", "locked"];

function isResolved(row: RowState | undefined): boolean {
  return !!row?.status && RESOLVED.includes(row.status);
}

export default function EnvPracticePage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const sectionFromUrl = new URLSearchParams(search).get("sectionId") ?? "";

  const { toast } = useToast();
  const { data: sections } = useListSections(id, {
    query: { queryKey: getListSectionsQueryKey(id) },
  });
  const quota = useGetPracticeQuota();

  // Generator config
  const [focus, setFocus] = useState("");
  const [sectionId, setSectionId] = useState(sectionFromUrl);
  const [problemType, setProblemType] = useState<PracticeProblemTypeRequest>("auto");
  const [strict, setStrict] = useState(false);

  // Attempt state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [problem, setProblem] = useState<InteractivePracticeProblem | null>(null);
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState<number | null>(null);
  const [result, setResult] = useState<CompleteAttemptResponse | null>(null);
  const [dailyLimit, setDailyLimit] = useState(false);

  const start = useStartPractice(id);
  const gradeStep = useGradeStep(attemptId);
  const requestHint = useRequestHint(attemptId);
  const complete = useCompleteAttempt(attemptId);

  const fillableIndices = useMemo(() => {
    if (!problem) return [] as number[];
    return problem.workTable
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.role !== "Given")
      .map(({ i }) => i);
  }, [problem]);

  function firstUnresolved(states: Record<number, RowState>): number | null {
    for (const i of fillableIndices) {
      if (!isResolved(states[i])) return i;
    }
    return null;
  }

  function resetAttempt() {
    setAttemptId(null);
    setProblem(null);
    setRowStates({});
    setInputs({});
    setCurrent(null);
    setResult(null);
  }

  function handleGenerate() {
    setDailyLimit(false);
    resetAttempt();
    start.mutate(
      {
        focus: focus.trim() || null,
        sectionId: sectionId || null,
        problemType,
      },
      {
        onSuccess: (res) => {
          setAttemptId(res.attemptId);
          setProblem(res.problem);
          const firstFillable = res.problem.workTable.findIndex((r) => r.role !== "Given");
          setCurrent(firstFillable === -1 ? null : firstFillable);
        },
        onError: (e) => {
          if (isDailyLimitError(e)) {
            setDailyLimit(true);
          } else {
            toast({
              title: "Could not generate problem",
              description: String(e),
              variant: "destructive",
            });
          }
        },
      },
    );
  }

  function handleSubmit(rowIndex: number, action: "submit" | "skip") {
    const answer = action === "skip" ? "" : inputs[rowIndex] ?? "";
    gradeStep.mutate(
      { rowIndex, userAnswer: answer, action, enableRetry: !strict },
      {
        onSuccess: (res) => {
          let status: RowStatus;
          if (res.reveal) status = "revealed";
          else if (res.status === "incorrect") status = strict ? "locked" : "incorrect";
          else status = res.status; // correct | nearly_correct | skipped

          const next = {
            ...rowStates,
            [rowIndex]: {
              status,
              userAnswer: answer,
              expected: res.expected,
              hint: res.hint ?? rowStates[rowIndex]?.hint,
              reveal: res.reveal ?? rowStates[rowIndex]?.reveal,
              nudge: res.nudge,
              attemptCount: res.attemptCount ?? (rowStates[rowIndex]?.attemptCount ?? 0) + 1,
            } as RowState,
          };
          setRowStates(next);
          if (isResolved(next[rowIndex])) {
            setCurrent(firstUnresolved(next));
          }
        },
        onError: (e) =>
          toast({ title: "Grading failed", description: String(e), variant: "destructive" }),
      },
    );
  }

  function handleHint(rowIndex: number) {
    requestHint.mutate(
      { rowIndex },
      {
        onSuccess: (res) => {
          const next = {
            ...rowStates,
            [rowIndex]: {
              ...rowStates[rowIndex],
              hint: res.hint ?? rowStates[rowIndex]?.hint,
              reveal: res.reveal ?? rowStates[rowIndex]?.reveal,
              status:
                res.kind === "revealed" ? "revealed" : rowStates[rowIndex]?.status,
            } as RowState,
          };
          setRowStates(next);
          if (res.kind === "revealed") setCurrent(firstUnresolved(next));
        },
      },
    );
  }

  function handleFinish() {
    complete.mutate(
      { abandoned: false },
      {
        onSuccess: (res) => setResult(res),
        onError: (e) =>
          toast({ title: "Could not finish", description: String(e), variant: "destructive" }),
      },
    );
  }

  const allResolved = problem != null && current === null && !result;

  return (
    <EnvLayout id={id}>
      {/* Generator */}
      {!problem && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <PencilRuler className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold">Work it out</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate a guided, step-by-step practice problem grounded in your material.
              Solve one step at a time — get hints when you're stuck.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Topic (optional)</Label>
                <Select value={sectionId || "all"} onValueChange={(v) => setSectionId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any topic</SelectItem>
                    {(sections ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="practice-focus">Focus (optional)</Label>
                <Input
                  id="practice-focus"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. depreciation"
                  data-testid="input-practice-focus"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Problem type</Label>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setProblemType(t.value)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      problemType === t.value
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {problemType === "auto"
                  ? "Adaptive reads your material and picks the most effective format — calculations for quantitative topics, conceptual questions for theory."
                  : "Pinned to a specific format. Switch to Adaptive to let Cognivate choose the best fit for your material."}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3">
              <div>
                <div className="text-sm font-medium">Strict mode</div>
                <div className="text-xs text-muted-foreground">
                  Hides hints and answer suggestions for harder practice.
                </div>
              </div>
              <Switch checked={strict} onCheckedChange={setStrict} />
            </div>

            {quota.data && !quota.data.isPremium && (
              <div className="text-xs text-muted-foreground">
                Practice today: {quota.data.used} / {quota.data.limit}
              </div>
            )}

            {dailyLimit && (
              <div className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm">
                You've reached today's free practice limit. Come back tomorrow or upgrade to
                Cognivate Premium for unlimited problems.
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={start.isPending}
              className="gap-2 bg-brand text-brand-foreground hover:opacity-90"
              data-testid="button-generate-practice"
            >
              {start.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate problem
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Solver */}
      {problem && !result && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold">{problem.goal}</h3>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <FormatBadge problem={problem} />
                  <SourceBadge status={problem.sourceStatus} />
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{problem.prompt}</p>
            </CardContent>
          </Card>

          <FactsCard problem={problem} />

          <div className="space-y-3">
            {problem.workTable.map((row, i) => {
              if (row.role === "Given") {
                return <GivenRow key={i} label={row.label} meaning={row.meaning} />;
              }
              const state = rowStates[i];
              const isCurrent = current === i;
              const resolved = isResolved(state);
              if (resolved) {
                return <ResolvedRow key={i} row={row} state={state} />;
              }
              if (!isCurrent) {
                return <UpcomingRow key={i} row={row} />;
              }
              const pool = strict ? undefined : problem.tokenPools?.[String(i)];
              return (
                <ActiveRow
                  key={i}
                  rowIndex={i}
                  purpose={row.purpose ?? row.role}
                  why={row.whyThisStepMatters ?? null}
                  hint={row.hint}
                  pool={pool}
                  state={state}
                  strict={strict}
                  value={inputs[i] ?? ""}
                  onChange={(v) => setInputs((p) => ({ ...p, [i]: v }))}
                  onSubmit={() => handleSubmit(i, "submit")}
                  onSkip={() => handleSubmit(i, "skip")}
                  onHint={() => handleHint(i)}
                  submitting={gradeStep.isPending}
                  hinting={requestHint.isPending}
                />
              );
            })}
          </div>

          {allResolved && (
            <Button
              onClick={handleFinish}
              disabled={complete.isPending}
              className="w-full gap-2 bg-brand text-brand-foreground hover:opacity-90"
            >
              {complete.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              See results
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {result && problem && (
        <ResultCard result={result} problem={problem} onNew={handleGenerate} />
      )}
    </EnvLayout>
  );
}

// ---------- Sub-components ----------

/**
 * Shows which format the adaptive selector chose for this problem, plus
 * the difficulty it targeted. Renders nothing for older problems that
 * predate adaptive mode (no problemFormat on the payload).
 */
function FormatBadge({ problem }: { problem: InteractivePracticeProblem }) {
  if (!problem.problemFormat) return null;
  const label = FORMAT_LABELS[problem.problemFormat] ?? problem.problemFormat;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {label}
      {typeof problem.difficulty === "number" && (
        <span className="text-muted-foreground/70">· Lvl {problem.difficulty}</span>
      )}
    </span>
  );
}

function FactsCard({ problem }: { problem: InteractivePracticeProblem }) {
  const groups: { role: string; label: string; className: string }[] = [
    { role: "needed", label: "Needed", className: "text-success" },
    { role: "helpful_context", label: "Helpful context", className: "text-muted-foreground" },
    { role: "not_used", label: "Not used", className: "text-warning" },
  ];
  const facts = problem.facts ?? null;
  if (!facts || facts.length === 0) {
    if (!problem.given?.length) return null;
    return (
      <Card>
        <CardContent className="p-5">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Given</div>
          <ul className="space-y-1 text-sm">
            {problem.given.map((g, i) => (
              <li key={i}>· {g}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">The facts</div>
        {groups.map((g) => {
          const items = facts.filter((f) => f.role === g.role);
          if (items.length === 0) return null;
          return (
            <div key={g.role}>
              <div className={cn("mb-1 text-xs font-semibold", g.className)}>{g.label}</div>
              <ul className="space-y-1 text-sm">
                {items.map((f) => (
                  <li key={f.id}>
                    <span className="font-medium">{f.label}:</span> {f.value}
                    {f.role === "not_used" && f.explanation && (
                      <span className="text-muted-foreground"> — {f.explanation}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function GivenRow({ label, meaning }: { label: string; meaning: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm">
      <span className="font-medium">{label}</span>
      {meaning && <span className="text-muted-foreground">— {meaning}</span>}
    </div>
  );
}

function UpcomingRow({ row }: { row: { purpose?: string | null; role: string } }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground/70">
      {row.purpose ?? row.role}
    </div>
  );
}

function ResolvedRow({
  row,
  state,
}: {
  row: { purpose?: string | null; role: string; label: string };
  state: RowState;
}) {
  const ok = state.status === "correct" || state.status === "nearly_correct";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "grid h-5 w-5 place-items-center rounded-full text-xs",
              ok ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          <span className="font-medium">{row.purpose ?? row.role}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {state.expected ?? row.label}
        </span>
      </div>
      {state.reveal && (
        <p className="mt-2 text-xs text-muted-foreground">{state.reveal.plainExplanation}</p>
      )}
    </div>
  );
}

function ActiveRow(props: {
  rowIndex: number;
  purpose: string;
  why: string | null;
  hint: string;
  pool?: string[];
  state?: RowState;
  strict: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onHint: () => void;
  submitting: boolean;
  hinting: boolean;
}) {
  const { state } = props;
  const wrong = state?.status === "incorrect";
  return (
    <Card className="border-brand/40 shadow-[var(--shadow-low)]">
      <CardContent className="space-y-3 p-5">
        <div>
          <div className="text-sm font-semibold">{props.purpose}</div>
          {props.why && <div className="text-xs text-muted-foreground">{props.why}</div>}
        </div>

        {!props.strict && props.hint && (
          <div className="text-sm italic text-muted-foreground">{props.hint}</div>
        )}

        {props.pool && props.pool.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {props.pool.map((tok, i) => (
              <button
                key={i}
                type="button"
                onClick={() => props.onChange(tok)}
                className="rounded-full border border-border px-3 py-1 text-sm hover:bg-secondary"
              >
                {tok}
              </button>
            ))}
          </div>
        )}

        <Input
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder="Your answer"
          onKeyDown={(e) => {
            if (e.key === "Enter" && props.value.trim() && !props.submitting) props.onSubmit();
          }}
          data-testid={`input-step-${props.rowIndex}`}
        />

        {wrong && state?.hint && (
          <div className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>{state.hint}</span>
          </div>
        )}
        {wrong && !state?.hint && (
          <div className="text-sm text-destructive">Not quite — check the hint and try again.</div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={props.onSubmit}
            disabled={props.submitting || !props.value.trim()}
            className="gap-2 bg-brand text-brand-foreground hover:opacity-90"
          >
            {props.submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Check
          </Button>
          {!props.strict && (
            <Button variant="outline" onClick={props.onHint} disabled={props.hinting} className="gap-2">
              {props.hinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              Get hint
            </Button>
          )}
          <Button variant="ghost" onClick={props.onSkip} disabled={props.submitting} className="gap-2 text-muted-foreground">
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultCard({
  result,
  problem,
  onNew,
}: {
  result: CompleteAttemptResponse;
  problem: InteractivePracticeProblem;
  onNew: () => void;
}) {
  const pct = Math.round(result.score * 100);
  return (
    <div className="space-y-4">
      <Card className="border-brand/30 bg-brand-soft">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-[var(--shadow-brand)]">
            <Trophy className="h-6 w-6" />
          </span>
          <div className="text-3xl font-bold">{pct}%</div>
          <p className="text-sm text-muted-foreground">
            {result.xpAwarded > 0 ? `+${result.xpAwarded} XP earned` : "Keep practicing to earn XP"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">Final answer</div>
            <FormatBadge problem={problem} />
          </div>
          <div className="font-mono text-base">{problem.finalAnswer}</div>
          <p className="text-sm text-muted-foreground">{problem.interpretation}</p>
          <SourceCitations refs={problem.sourceReferences} />
        </CardContent>
      </Card>

      <Button onClick={onNew} className="w-full gap-2 bg-brand text-brand-foreground hover:opacity-90">
        <RotateCcw className="h-4 w-4" />
        New problem
      </Button>
    </div>
  );
}
