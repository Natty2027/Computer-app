/**
 * Spaced-repetition review + grading hooks. Mirrors the mobile
 * `lib/review.ts` — plain `customFetch` calls wrapped in React Query,
 * since these endpoints aren't in the Orval-generated client.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

import { useAuthReady } from "@/hooks/useAuthReady";
import { myProgressQueryKey } from "./progress";

export type SourceTier =
  | "from_source"
  | "mostly_from_source"
  | "ai_filled_gap"
  | "ai_generated_example"
  | "ai_generated_explanation"
  | "not_in_source";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type SourceReference = {
  fileName: string;
  location: string | null;
  excerpt: string | null;
};

export type VocabPayload = {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  sourceStatus: SourceTier | string;
  sourceReferences: SourceReference[];
};

export type FormulaPayload = {
  id: string;
  name: string;
  expression: string;
  plainMeaning: string;
  whenToUse: string | null;
  miniExample: string | null;
  sourceStatus: SourceTier | string;
  sourceReferences: SourceReference[];
};

export type QuizQuestionPayload = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number | null;
  explanation: string | null;
  sourceStatus: SourceTier | string;
  sourceReferences: SourceReference[];
};

export type DueItem = {
  id: string;
  kind: "vocab" | "formula" | "quiz_question";
  sourceTier: string;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lapseCount: number;
  dueAt: string;
  lastReviewedAt: string | null;
  payload: VocabPayload | FormulaPayload | QuizQuestionPayload;
};

export type DueGroup = {
  envId: string;
  envTitle: string;
  items: DueItem[];
};

export type GamificationResult = {
  xpAwarded: number;
  newXpTotal: number;
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  leveledUp: boolean;
  streak: number;
  freezeUsed: boolean;
  achievementsUnlocked: string[];
};

export type GradeResponse = {
  id: string;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt: string | null;
  reviewCount: number;
  lapseCount: number;
  gamification: GamificationResult;
};

export const reviewDueQueryKey = ["review", "due"] as const;

export function useReviewDue(): UseQueryResult<DueGroup[]> {
  const authReady = useAuthReady();
  return useQuery<DueGroup[]>({
    queryKey: reviewDueQueryKey,
    enabled: authReady,
    staleTime: 60_000,
    queryFn: () => customFetch<DueGroup[]>("/api/review/due"),
  });
}

export function useGradeReview(): UseMutationResult<
  GradeResponse,
  Error,
  { itemId: string; grade: ReviewGrade }
> {
  const qc = useQueryClient();
  return useMutation<GradeResponse, Error, { itemId: string; grade: ReviewGrade }>({
    mutationFn: (args) =>
      customFetch<GradeResponse>("/api/review/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args),
      }),
    onSuccess: () => {
      // Refresh the streak/XP header immediately; the local stack drives
      // the review UI so we don't refetch /due mid-session.
      qc.invalidateQueries({ queryKey: myProgressQueryKey });
    },
  });
}

export function useFlagReview(): UseMutationResult<
  { id: string; createdAt: string },
  Error,
  { itemId: string; note?: string }
> {
  return useMutation({
    mutationFn: (args) =>
      customFetch<{ id: string; createdAt: string }>(
        "/api/review/flag-source-mismatch",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(args),
        },
      ),
  });
}
