import { Trophy, Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAchievements, type AchievementEntry } from "@/lib/api/progress";
import { cn } from "@/lib/utils";

export default function AchievementsPage() {
  const { data, isLoading, isError } = useAchievements();
  const newly = new Set(data?.newlyUnlocked ?? []);

  const catalog = data?.catalog ?? [];
  const unlocked = catalog.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          {catalog.length > 0 ? `${unlocked} of ${catalog.length} unlocked` : "Milestones you've earned."}
        </p>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : isError ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Couldn't load achievements.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((a) => (
            <AchievementCard key={a.key} a={a} isNew={newly.has(a.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ a, isNew }: { a: AchievementEntry; isNew: boolean }) {
  return (
    <Card
      className={cn(
        a.unlocked ? "border-brand/30 bg-brand-soft" : "opacity-70",
        isNew && "ring-2 ring-celebration",
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
            a.unlocked ? "bg-brand text-brand-foreground shadow-[var(--shadow-brand)]" : "bg-muted text-muted-foreground",
          )}
        >
          {a.unlocked ? <Trophy className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{a.title}</h3>
            {isNew && <span className="rounded-full bg-celebration px-2 py-0.5 text-[10px] font-bold text-celebration-foreground">NEW</span>}
          </div>
          <p className="text-sm text-muted-foreground">{a.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
