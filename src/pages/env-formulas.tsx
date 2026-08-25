import { useParams, useLocation } from "wouter";
import { useListFormulas, getListFormulasQueryKey } from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { PencilRuler } from "lucide-react";

export default function EnvFormulasPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useListFormulas(id, { query: { queryKey: getListFormulasQueryKey(id) } });
  return (
    <EnvLayout id={id}>
      <h2 className="font-serif text-xl">Formulas & methods</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No formulas detected — your material may not require any.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {data.map((f) => (
            <Card key={f.id} data-testid={`card-formula-${f.id}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-serif text-lg font-semibold" data-testid={`text-formula-name-${f.id}`}>{f.name}</h3>
                    <pre className="mt-1 rounded-md bg-secondary px-3 py-2 text-sm font-mono whitespace-pre-wrap" data-testid={`text-formula-expr-${f.id}`}>{f.expression}</pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <SourceBadge status={f.sourceStatus} />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => setLocation(`/env/${id}/practice?formulaId=${f.id}`)}
                      data-testid={`button-practice-${f.id}`}
                    >
                      <PencilRuler className="h-3.5 w-3.5" /> Practice this
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{f.plainMeaning}</p>
                {f.variables && f.variables.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Variables</div>
                    <ul className="space-y-1 text-sm">
                      {f.variables.map((v, i) => (
                        <li key={i}><span className="font-mono font-semibold mr-2">{v.symbol}</span>{v.meaning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {f.whenToUse && <p className="text-sm"><span className="font-medium">When to use: </span>{f.whenToUse}</p>}
                {f.steps && f.steps.length > 0 && (
                  <ol className="list-decimal ml-5 space-y-1 text-sm">
                    {f.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                )}
                {f.miniExample && (
                  <div className="rounded-md bg-secondary/50 p-3 text-sm">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Mini example</div>
                    {f.miniExample}
                  </div>
                )}
                {f.commonMistake && (
                  <p className="text-sm border-l-2 border-amber-400 pl-3 text-foreground/90">
                    <span className="font-medium">Watch out: </span>{f.commonMistake}
                  </p>
                )}
                <SourceCitations refs={f.sourceReferences} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </EnvLayout>
  );
}
