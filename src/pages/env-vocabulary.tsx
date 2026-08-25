import { useParams } from "wouter";
import { useListVocabulary, getListVocabularyQueryKey } from "@workspace/api-client-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";

export default function EnvVocabularyPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useListVocabulary(id, { query: { queryKey: getListVocabularyQueryKey(id) } });
  return (
    <EnvLayout id={id}>
      <h2 className="font-serif text-xl">Vocabulary bank</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No vocabulary terms yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((v) => (
            <Card key={v.id} data-testid={`card-vocab-${v.id}`}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-lg font-semibold" data-testid={`text-term-${v.id}`}>{v.term}</h3>
                  <SourceBadge status={v.sourceStatus} />
                </div>
                <p className="text-sm leading-relaxed">{v.definition}</p>
                {v.example && (
                  <p className="text-sm italic text-muted-foreground border-l-2 border-border pl-3">{v.example}</p>
                )}
                {v.related && v.related.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {v.related.map((r, i) => (
                      <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{r}</span>
                    ))}
                  </div>
                )}
                <SourceCitations refs={v.sourceReferences} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </EnvLayout>
  );
}
