import { useParams } from "wouter";
import { useListSections, getListSectionsQueryKey } from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { SimplifyButton } from "@/components/SimplifyButton";

export default function EnvSectionsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useListSections(id, { query: { queryKey: getListSectionsQueryKey(id) } });
  return (
    <EnvLayout id={id}>
      <h2 className="font-serif text-xl">Outline</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No sections detected yet — Cognivate will populate this once analysis finishes.</CardContent></Card>
      ) : (
        <ol className="space-y-3">
          {data.map((s, i) => (
            <li key={s.id} data-testid={`row-section-${s.id}`}>
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Section {i + 1}</div>
                      <h3 className="font-serif text-lg font-medium" data-testid={`text-section-title-${s.id}`}>{s.title}</h3>
                    </div>
                    <SourceBadge status={s.sourceStatus} />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{s.summary}</p>
                  <SimplifyButton envId={id} text={`${s.title}. ${s.summary ?? ""}`} />
                  {s.keyConcepts && s.keyConcepts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.keyConcepts.map((c, j) => (
                        <span key={j} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground" data-testid={`chip-concept-${s.id}-${j}`}>{c}</span>
                      ))}
                    </div>
                  )}
                  <SourceCitations refs={s.sourceReferences} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </EnvLayout>
  );
}
