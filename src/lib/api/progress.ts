/**
 * Gamification surface: XP/level/streak progress, achievements, and the
 * standalone streak query. Mirrors mobile `lib/review.ts` + `lib/streaks.ts`.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

import { useAuthReady } from "@/hooks/useAuthReady";

export type Progress = {
  xpTotal: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  xpToNextLevel: number;
  dailyStreakCount: number;
  longestStreak: number;
  freezeTokens: number;
  lastStudyDate: string | null;
};

export type AchievementEntry = {
  key: string;
  title: string;
  description: string;
  kind: "streak" | "count" | "first" | "manual";
  unlocked: boolean;
  unlockedAt: string | null;
};

export type AchievementsResponse = {
  catalog: AchievementEntry[];
  newlyUnlocked: string[];
};

export type Streak = {
  current: number;
  longest: number;
  lastActivityDate: string | null;
  proDayExpiresAt?: string | null;
  proDayJustGranted?: boolean;
};

export const myProgressQueryKey = ["me", "progress"] as const;
export const myAchievementsQueryKey = ["me", "achievements"] as const;
export const myStreakQueryKey = ["me", "streak"] as const;

export function useProgress(): UseQueryResult<Progress> {
  const authReady = useAuthReady();
  return useQuery<Progress>({
    queryKey: myProgressQueryKey,
    enabled: authReady,
    staleTime: 30_000,
    queryFn: () => customFetch<Progress>("/api/me/progress"),
  });
}

export function useAchievements(): UseQueryResult<AchievementsResponse> {
  const authReady = useAuthReady();
  return useQuery<AchievementsResponse>({
    queryKey: myAchievementsQueryKey,
    enabled: authReady,
    // Server runs the evaluator on every GET — keep it lazy.
    staleTime: 5 * 60_000,
    queryFn: () => customFetch<AchievementsResponse>("/api/me/achievements"),
  });
}

export function useStreak(): UseQueryResult<Streak> {
  const authReady = useAuthReady();
  return useQuery<Streak>({
    queryKey: myStreakQueryKey,
    enabled: authReady,
    staleTime: 5 * 60_000,
    queryFn: () => customFetch<Streak>("/api/me/streak"),
  });
}
