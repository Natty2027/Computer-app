/**
 * Study calendar — one entry per day: whether the user studied and how
 * many review items fall due. Server buckets days in UTC, so the client
 * builds the from/to range in UTC too. Mirrors mobile `app/calendar.tsx`.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

import { useAuthReady } from "@/hooks/useAuthReady";

export type CalendarDay = {
  date: string;
  studied: boolean;
  dueCount: number;
};

export type CalendarResponse = { days: CalendarDay[] };

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function firstOfMonth(year: number, month0: number): string {
  return `${year}-${pad(month0 + 1)}-01`;
}

export function lastOfMonth(year: number, month0: number): string {
  const d = new Date(Date.UTC(year, month0 + 1, 0));
  return `${year}-${pad(month0 + 1)}-${pad(d.getUTCDate())}`;
}

export function useCalendarMonth(
  year: number,
  month0: number,
): UseQueryResult<CalendarResponse> {
  const authReady = useAuthReady();
  const from = firstOfMonth(year, month0);
  const to = lastOfMonth(year, month0);
  return useQuery<CalendarResponse>({
    queryKey: ["calendar", year, month0] as const,
    enabled: authReady,
    staleTime: 60_000,
    queryFn: () =>
      customFetch<CalendarResponse>(`/api/calendar?from=${from}&to=${to}`),
  });
}
