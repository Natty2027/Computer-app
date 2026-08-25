import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  useGetEnvironmentDashboard,
  getGetEnvironmentDashboardQueryKey,
  useExplainSelection,
  useDeleteEnvironment,
  useReanalyzeEnvironment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EnvLayout } from "@/components/EnvLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, ListTree, GraduationCap, Calculator, Sparkles, Highlighter, MessagesSquare, PencilRuler, Trash2, Loader2,
} from "lucide-react";
import { SourceBadge, SourceCitations } from "@/components/SourceBadge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const STAT_TILES: Array<{ key: string; label: string; Icon: any; href: (id: string) => string }> = [
  { key: "files", label: "Materials", Icon: FileText, href: (id) => `/env/${id}/files` },
  { key: "sections", label: "Sections", Icon: ListTree, href: (id) => `/env/${id}/sections` },
  { key: "vocabulary", label: "Vocabulary", Icon: GraduationCap, href: (id) => `/env/${id}/vocabulary` },
  { key: "formulas", label: "Formulas", Icon: Calculator, href: (id) => `/env/${id}/formulas` },
  { key: "quizzes", label: "Quizzes", Icon: Sparkles, href: (id) => `/env/${id}/quizzes` },
  { key: "highlights", label: "Highlights", Icon: Highlighter, href: (id) => `/env/${id}/highlights` },
];

export default function EnvDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data, isLoading } = useGetEnvironmentDashboard(id, {
    query: {
      queryKey: getGetEnvironmentDashboardQueryKey(id),
      refetchInterval: (q) => {
        const d: any = q.state.data;
        return d?.environment?.status === "analyzing" ? 3000 : false;
      },
    },
  });
  const explain = useExplainSelection();
  const del = useDeleteEnvironment();
  const reanalyze = useReanalyzeEnvironment();
  const qc = useQueryClient();
  const [explainText, setExplainText] = useState("");
  const [explainResult, setExplainResult] = useState<any>(null);
  const envStatus = (data as any)?.environment?.status;
  const envError = (data as any)?.environment?.analysisError;

  return (
    <EnvLayout id={id}>
      {envStatus === "failed" && (
        <Card className="border-destructive/40 bg-destructive/5" data-testid="banner-analysis-failed">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Analysis didn't finish</div>
              <div className="text-xs text-muted-foreground mt-0.5 break-words">
                {envError || "Something went wrong while reading your materials."}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={reanalyze.isPending}
              onClick={() =>
                reanalyze.mutate(
                  { id },
                  {
                    onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getGetEnvironmentDashboardQueryKey(id) });
                      toast({ title: "Re-analysis started" });
                    },
                    onError: (e) => toast({ title: "Couldn't start re-analysis", description: String(e), variant: "destructive" }),
                  },
                )
              }
              data-testid="button-retry-analysis"
              className="gap-2"
            >
              {reanalyze.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_TILES.map(({ key, label, Icon, href }) => (
          <Link key={key} href={href(id)} data-testid={`tile-${key}`} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-serif font-semibold" data-testid={`stat-${key}`}>
                  {isLoading ? <Skeleton className="h-7 w-10" /> : (data?.stats as any)?.[key] ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Quick start</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button variant="secondary" className="justify-start gap-3 h-auto py-3" onClick={() => setLocation(`/env/${id}/quizzes`)} data-testid="button-quick-quiz">
                <Sparkles className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Generate a quiz</div>
                  <div className="text-xs text-muted-foreground">Test what you know</div>
                </div>
              </Button>
              <Button variant="secondary" className="justify-start gap-3 h-auto py-3" onClick={() => setLocation(`/env/${id}/practice`)} data-testid="button-quick-practice">
                <PencilRuler className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Work it out</div>
                  <div className="text-xs text-muted-foreground">Step-by-step practice</div>
                </div>
              </Button>
              <Button variant="secondary" className="justify-start gap-3 h-auto py-3" onClick={() => setLocation(`/env/${id}/tutor`)} data-testid="button-quick-tutor">
                <MessagesSquare className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Ask the tutor</div>
                  <div className="text-xs text-muted-foreground">Grounded in your material</div>
                </div>
              </Button>
              <Button variant="secondary" className="justify-start gap-3 h-auto py-3" onClick={() => setLocation(`/env/${id}/files`)} data-testid="button-quick-add-files">
                <FileText className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Add more materials</div>
                  <div className="text-xs text-muted-foreground">Expand your environment</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-serif text-lg">Areas to revisit</h2>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : data?.weakAreas && data.weakAreas.length > 0 ? (
              <ul className="space-y-2">
                {data.weakAreas.map((w, i) => (
                  <li key={i} className="rounded-md border border-border p-2.5" data-testid={`row-weak-${i}`}>
                    <div className="text-sm font-medium">{w.topic}</div>
                    <div className="text-xs text-muted-foreground">{w.reason}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No gaps detected yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-serif text-lg">Explain something in your own words</h2>
          <p className="text-sm text-muted-foreground">Paste a passage from your readings — Cognivate will explain it in plain language and tell you where it came from.</p>
          <Textarea
            value={explainText}
            onChange={(e) => setExplainText(e.target.value)}
            placeholder="Paste a sentence or paragraph here…"
            rows={3}
            data-testid="input-explain-text"
          />
          <div className="flex justify-end">
            <Button
              disabled={!explainText.trim() || explain.isPending}
              onClick={() => {
                explain.mutate(
                  { id, data: { text: explainText.trim() } },
                  {
                    onSuccess: (r) => setExplainResult(r),
                    onError: (e) => toast({ title: "Could not generate explanation", description: String(e), variant: "destructive" }),
                  },
                );
              }}
              data-testid="button-explain"
              className="gap-2"
            >
              {explain.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Explain this
            </Button>
          </div>
          {explainResult && (
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2" data-testid="text-explain-result">
              <SourceBadge status={explainResult.sourceStatus} />
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{explainResult.explanation}</p>
              <SourceCitations refs={explainResult.sourceReferences ?? []} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-serif text-lg">Recent activity</h2>
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : data?.recentActivity && data.recentActivity.length > 0 ? (
            <ul className="space-y-2">
              {data.recentActivity.map((a, i) => (
                <li key={i} className="text-sm flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0" data-testid={`row-activity-${i}`}>
                  <span>{a.label}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive gap-2"
          onClick={() => {
            if (confirm("Delete this environment and all its materials? This cannot be undone.")) {
              del.mutate({ id }, {
                onSuccess: () => setLocation("/"),
                onError: (e) => toast({ title: "Could not delete", description: String(e), variant: "destructive" }),
              });
            }
          }}
          data-testid="button-delete-env"
        >
          <Trash2 className="h-4 w-4" /> Delete this environment
        </Button>
      </div>
    </EnvLayout>
  );
}
