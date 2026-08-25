import { useParams, useSearch } from "wouter";
import { useState } from "react";
import { useGeneratePractice } from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { Loader2, PencilRuler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EnvPracticePage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const formulaId = new URLSearchParams(search).get("formulaId") ?? undefined;
  const [focus, setFocus] = useState("");
  const [problem, setProblem] = useState<any | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const generate = useGeneratePractice();
  const { toast } = useToast();

  return (
    <EnvLayout id={id}>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <PencilRuler className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-serif text-lg">Work it out</h2>
          </div>
          <p className="text-sm text-muted-foreground">Generate a guided practice problem grounded in your material.</p>
          <div className="grid sm:grid-cols-[1fr_auto] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="practice-focus">Focus (optional)</Label>
              <Input id="practice-focus" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. depreciation" data-testid="input-practice-focus" />
            </div>
            <div className="self-end">
              <Button
                disabled={generate.isPending}
                className="gap-2"
                onClick={() => {
                  setShowAnswer(false);
                  setProblem(null);
                  generate.mutate(
                    { id, data: { focus: focus || undefined, formulaId } },
                    {
                      onSuccess: (p) => setProblem(p),
                      onError: (e) => toast({ title: "Could not generate problem", description: String(e), variant: "destructive" }),
                    },
                  );
                }}
                data-testid="button-generate-practice"
              >
                {generate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {problem ? "Generate another" : "Generate problem"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {problem && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-lg font-semibold">{problem.goal}</h3>
              <SourceBadge status={problem.sourceStatus} />
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" data-testid="text-practice-prompt">{problem.prompt}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {problem.given?.length > 0 && (
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Given</div>
                  <ul className="text-sm space-y-1">{problem.given.map((g: string, i: number) => <li key={i}>· {g}</li>)}</ul>
                </div>
              )}
              {problem.findFirst?.length > 0 && (
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Find first</div>
                  <ul className="text-sm space-y-1">{problem.findFirst.map((g: string, i: number) => <li key={i}>· {g}</li>)}</ul>
                </div>
              )}
            </div>
            {problem.plan?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Plan</div>
                <ol className="list-decimal ml-5 text-sm space-y-1">{problem.plan.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>
              </div>
            )}
            {problem.workTable?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Work table</div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left px-3 py-2">Label</th>
                        <th className="text-left px-3 py-2">Role</th>
                        <th className="text-left px-3 py-2">Hint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problem.workTable.map((r: any, i: number) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{r.label}{r.meaning ? <div className="text-xs text-muted-foreground">{r.meaning}</div> : null}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.role}</td>
                          <td className="px-3 py-2">{r.hint}{r.formula ? <div className="text-xs font-mono mt-1">{r.formula}</div> : null}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {problem.formulaUsed && (
              <p className="text-sm"><span className="font-medium">Formula used: </span><span className="font-mono">{problem.formulaUsed}</span></p>
            )}
            <div>
              <Button variant="secondary" size="sm" onClick={() => setShowAnswer((v) => !v)} data-testid="button-toggle-answer">
                {showAnswer ? "Hide answer" : "Reveal answer"}
              </Button>
            </div>
            {showAnswer && (
              <div className="rounded-md bg-secondary/50 p-4 space-y-2" data-testid="text-practice-answer">
                <div className="font-medium">Final answer: <span className="font-mono">{problem.finalAnswer}</span></div>
                <p className="text-sm">{problem.interpretation}</p>
                <SourceCitations refs={problem.sourceReferences} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </EnvLayout>
  );
}
