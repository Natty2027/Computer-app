import { Link, useLocation } from "wouter";
import { useListEnvironments, getListEnvironmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Sparkles, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready: "bg-emerald-500",
    analyzing: "bg-amber-500 animate-pulse",
    uploaded: "bg-amber-500 animate-pulse",
    empty: "bg-stone-400",
    failed: "bg-red-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] ?? "bg-stone-400"}`} />;
}

export default function LibraryPage() {
  const { data, isLoading } = useListEnvironments({
    query: {
      queryKey: getListEnvironmentsQueryKey(),
      refetchInterval: (q) => {
        const list: any = q.state.data;
        if (Array.isArray(list) && list.some((e) => e.status === "analyzing" || e.status === "uploaded")) return 3000;
        return false;
      },
    },
  });
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">Your study library</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Each environment is a private study space built from the materials you upload. Cognivate reads them, organizes them, and stays grounded in your sources.
          </p>
        </div>
        <Button onClick={() => setLocation("/new")} data-testid="button-new-env" className="gap-2">
          <Plus className="h-4 w-4" /> New environment
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card className="overflow-hidden border-dashed">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
              <Upload className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-xl">Start your first study environment</h2>
              <p className="text-muted-foreground mt-1">Upload course readings, slides, notes, or photos of your homework. Cognivate will build the rest.</p>
            </div>
            <Button onClick={() => setLocation("/new")} data-testid="button-create-first" className="gap-2">
              <Plus className="h-4 w-4" /> Upload your first material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((env) => (
            <Link key={env.id} href={`/env/${env.id}`} data-testid={`card-env-${env.id}`} className="block">
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                      <StatusDot status={env.status} />
                      {env.status === "analyzing" ? "Analyzing" : env.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium leading-snug" data-testid={`text-env-title-${env.id}`}>
                      {env.title}
                    </h3>
                    {env.detectedSubject ? (
                      <p className="mt-1 text-sm text-muted-foreground" data-testid={`text-env-subject-${env.id}`}>
                        {env.detectedSubject}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground italic">Subject will appear after analysis</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>{env.fileCount} {env.fileCount === 1 ? "file" : "files"}</span>
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Open</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
