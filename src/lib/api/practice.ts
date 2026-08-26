/**
 * Interactive practice — start an attempt, grade each step, request hints,
 * and complete for a score. Types mirror `lib/api-zod/src/practiceInteractive.ts`
 * and the routes in `api-server/src/routes/practiceInteractive.ts`.
 *
 * These endpoints are not in the Orval client, so we call `customFetch`
 * directly, same as the mobile app.
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

export type PracticeSourceStatus =
  | "from_source"
  | "mostly_from_source"
  | "ai_filled_gap"
  | "ai_generated_example";

export type PracticeProblemType = "calculation" | "conceptual" | "application";

/**
 * The format the server actually generated. Same values as
 * PracticeProblemType, but a distinct concept: `problemType` is what the
 * user REQUESTS (including "auto"), while `problemFormat` is what the
 * model CHOSE for the material.
 */
export type PracticeProblemFormat = "calculation" | "conceptual" | "application";

/**
 * Request-side format selector. "auto" (the default) lets the server
 * inspect the material and pick the most effective format; the three
 * concrete values pin it as a user override.
 */
export type PracticeProblemTypeRequest = PracticeProblemType | "auto";

export type PracticeFactRole = "needed" | "helpful_context" | "not_used";

export type PracticeFact = {
  id: string;
  label: string;
  value: string;
  role: PracticeFactRole;
  explanation: string | null;
};

export type WorkTableRow = {
  label: string;
  meaning: string | null;
  role: "Given" | "Find" | "Find first" | "Logic" | "Final answer";
  hint: string;
  formula: string | null;
  purpose?: string | null;
  whyThisStepMatters?: string | null;
  relatedFactIds?: string[] | null;
  unusedFactIds?: string[] | null;
};

export type PracticeSourceReference = {
  fileName: string;
  location: string | null;
  excerpt: string | null;
};

export type InteractivePracticeProblem = {
  id: string;
  prompt: string;
  goal: string;
  given: string[];
  findFirst: string[];
  plan: string[];
  workTable: WorkTableRow[];
  formulaUsed: string | null;
  finalAnswer: string;
  interpretation: string;
  sourceStatus: PracticeSourceStatus;
  sourceReferences: PracticeSourceReference[];
  tokenPools?: Record<string, string[]>;
  facts?: PracticeFact[] | null;
  /** Format the server chose for this problem (adaptive mode) or the
   * format the user pinned. Null/absent for problems generated before
   * adaptive mode. */
  problemFormat?: PracticeProblemFormat | null;
  /** Adaptive difficulty (1..5) the problem was generated at, or null
   * when there was no history to adapt from. */
  difficulty?: number | null;
};

export type StartAttemptResponse = {
  attemptId: string;
  problem: InteractivePracticeProblem;
};

export type StepReveal = {
  answer: string;
  formula: string | null;
  plainExplanation: string;
  whyThisStepMatters: string | null;
  unusedInfoExplanation: string | null;
};

export type StepGradeResponse = {
  status: "correct" | "nearly_correct" | "incorrect" | "skipped";
  expected: string | null;
  nudge: string | null;
  nextRowIndex: number | null;
  attemptCount?: number | null;
  hint?: string | null;
  reveal?: StepReveal | null;
};

export type RequestHintResponse = {
  kind: "hint" | "revealed";
  hint: string | null;
  reveal: StepReveal | null;
};

export type RowResult = {
  rowIndex: number;
  status: "correct" | "nearly_correct" | "skipped" | "incorrect_locked";
  attempts: number;
  hintsViewed: number;
  finalAnswer: string;
  answerRevealed?: boolean;
};

export type CompleteAttemptResponse = {
  attemptId: string;
  score: number;
  rowResults: RowResult[];
  xpAwarded: number;
  abandoned: boolean;
};

export type StartPracticeArgs = {
  focus?: string | null;
  sectionId?: string | null;
  /** "auto" (default) asks the server to adapt the format to the
   * material; a concrete value pins it. */
  problemType?: PracticeProblemTypeRequest;
};

export type SubmitStepArgs = {
  rowIndex: number;
  userAnswer: string;
  action: "submit" | "skip";
  enableRetry?: boolean;
};

export type PracticeQuota = {
  used: number;
  limit: number;
  isPremium: boolean;
};

export const practiceQuotaQueryKey = ["me", "practice-quota"] as const;

export function useStartPractice(
  envId: string,
): UseMutationResult<StartAttemptResponse, Error, StartPracticeArgs> {
  const qc = useQueryClient();
  return useMutation<StartAttemptResponse, Error, StartPracticeArgs>({
    mutationFn: (args) =>
      customFetch<StartAttemptResponse>(
        `/api/environments/${encodeURIComponent(envId)}/practice/interactive`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(args),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: practiceQuotaQueryKey });
    },
  });
}

export function useGradeStep(
  attemptId: string | null,
): UseMutationResult<StepGradeResponse, Error, SubmitStepArgs> {
  return useMutation<StepGradeResponse, Error, SubmitStepArgs>({
    mutationFn: (args) =>
      customFetch<StepGradeResponse>(
        `/api/practice/attempts/${encodeURIComponent(attemptId ?? "")}/steps`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(args),
        },
      ),
  });
}

export function useRequestHint(
  attemptId: string | null,
): UseMutationResult<RequestHintResponse, Error, { rowIndex: number }> {
  return useMutation<RequestHintResponse, Error, { rowIndex: number }>({
    mutationFn: ({ rowIndex }) =>
      customFetch<RequestHintResponse>(
        `/api/practice/attempts/${encodeURIComponent(
          attemptId ?? "",
        )}/steps/${rowIndex}/hint`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rowIndex }),
        },
      ),
  });
}

export function useCompleteAttempt(
  attemptId: string | null,
): UseMutationResult<CompleteAttemptResponse, Error, { abandoned?: boolean }> {
  const qc = useQueryClient();
  return useMutation<CompleteAttemptResponse, Error, { abandoned?: boolean }>({
    mutationFn: (args) =>
      customFetch<CompleteAttemptResponse>(
        `/api/practice/attempts/${encodeURIComponent(attemptId ?? "")}/complete`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(args ?? {}),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me", "progress"] });
    },
  });
}

export function useGetPracticeQuota(): UseQueryResult<PracticeQuota> {
  const authReady = useAuthReady();
  return useQuery<PracticeQuota>({
    queryKey: practiceQuotaQueryKey,
    enabled: authReady,
    staleTime: 30_000,
    retry: false,
    queryFn: () => customFetch<PracticeQuota>("/api/me/practice-quota"),
  });
}
