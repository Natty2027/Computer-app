import { Card, CardContent } from "@/components/ui/card";
import { LockedFeature } from "@/components/study/LockedFeature";
import { useStats, type DayBucket } from "@/lib/api/stats";
import { isPremiumError } from "@/lib/api/premium";

function accuracyPct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export default function StatsPage() {
  const { data, isLoading, isError, error } = useStats();

  if (isError && isPremiumError(error)) {
    return (
      <div className="space-y-6">
        <Header />
        <LockedFeature
          title="Stats is a Premium feature"
          description="Track your quiz accuracy over time and see per-subject breakdowns with Cognivate Premium."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />
      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Loading your stats…</CardContent></Card>
      ) : isError ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Couldn't load your stats.</CardContent></Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Quizzes taken" value={data.totalQuizzes} />
            <Tile label="Questions answered" value={data.totalQuestions} />
            <Tile label="Overall accuracy" value={`${Math.round(data.overallAccuracy * 100)}%`} />
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="mb-4 text-sm font-semibold">Last 30 days</div>
              <ThirtyDayBars days={data.last30Days} />
            </CardContent>
          </Card>

          {data.perEnvironment.length > 0 && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="text-sm font-semibold">By subject</div>
                {data.perEnvironment.map((env) => (
                  <div key={env.environmentId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{env.environmentName}</span>
                      <span className="text-muted-foreground">
                        {Math.round(env.accuracy * 100)}% · {env.quizzes} quizzes
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(env.accuracy * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Stats</h1>
      <p className="text-sm text-muted-foreground">Your learning progress over time.</p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function ThirtyDayBars({ days }: { days: DayBucket[] }) {
  if (days.length === 0) {
    return <div className="text-sm text-muted-foreground">No quiz activity yet.</div>;
  }
  return (
    <div className="flex h-28 items-end gap-1">
      {days.map((d) => {
        const pct = accuracyPct(d.correct, d.total);
        return (
          <div
            key={d.day}
            className="flex-1 rounded-t bg-brand/80"
            style={{ height: `${Math.max(4, pct)}%`, opacity: d.total > 0 ? 1 : 0.2 }}
            title={`${d.day}: ${pct}% (${d.quizzes} quizzes)`}
          />
        );
      })}
    </div>
  );
}
