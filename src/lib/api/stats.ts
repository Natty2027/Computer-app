/**
 * Aggregated quiz-attempt stats (premium-gated on the server). Mirrors
 * mobile `lib/stats.ts`. On web we don't pre-gate — we fetch and let the
 * page render a locked state if the server responds with 402/403
 * (see `isPremiumError`).
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

import { useAuthReady } from "@/hooks/useAuthReady";

export type DayBucket = {
  day: string;
  quizzes: number;
  correct: number;
  total: number;
};

export type EnvironmentBucket = {
  environmentId: string;
  environmentName: string;
  quizzes: number;
  questions: number;
  correct: number;
  accuracy: number;
};

export type Stats = {
  totalQuizzes: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  last30Days: DayBucket[];
  perEnvironment: EnvironmentBucket[];
};

export const statsQueryKey = ["me", "stats"] as const;

export function useStats(): UseQueryResult<Stats> {
  const authReady = useAuthReady();
  return useQuery<Stats>({
    queryKey: statsQueryKey,
    enabled: authReady,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: () => customFetch<Stats>("/api/me/stats"),
  });
}
