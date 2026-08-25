import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useCalendarMonth, type CalendarDay } from "@/lib/api/calendar";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function CalendarPage() {
  const [, setLocation] = useLocation();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month0, setMonth0] = useState(now.getUTCMonth());

  const { data, isLoading, isError } = useCalendarMonth(year, month0);
  const days = data?.days ?? [];

  const firstWeekday = useMemo(() => {
    if (days.length === 0) return 0;
    return new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay();
  }, [days]);

  const cells: (CalendarDay | null)[] = useMemo(
    () => [...Array.from({ length: firstWeekday }, () => null), ...days],
    [days, firstWeekday],
  );

  const todayKey = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;

  function prevMonth() {
    if (month0 === 0) { setYear((y) => y - 1); setMonth0(11); }
    else setMonth0((m) => m - 1);
  }
  function nextMonth() {
    if (month0 === 11) { setYear((y) => y + 1); setMonth0(0); }
    else setMonth0((m) => m + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Calendar</h1>
        <p className="text-sm text-muted-foreground">Days you studied and reviews coming due.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-lg font-semibold">{MONTHS[month0]} {year}</div>
            <button type="button" onClick={nextMonth} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : isError ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Couldn't load your calendar.</div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, i) => {
                if (!cell) return <div key={`b-${i}`} className="aspect-square" />;
                const dayNum = Number(cell.date.slice(-2));
                const isToday = cell.date === todayKey;
                const tappable = cell.dueCount > 0;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={!tappable}
                    onClick={() => tappable && setLocation("/today")}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm",
                      isToday ? "border-2 border-brand" : "border border-transparent",
                      tappable ? "hover:bg-secondary" : "cursor-default",
                    )}
                  >
                    <span>{dayNum}</span>
                    <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", cell.studied ? "bg-brand" : "bg-transparent")} />
                    {cell.dueCount > 0 && (
                      <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-soft px-1 text-[10px] font-bold text-brand">
                        {cell.dueCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Studied</span>
            <span className="flex items-center gap-1.5"><span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-soft px-1 text-[10px] font-bold text-brand">3</span> Reviews due</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
