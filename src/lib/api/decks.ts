/**
 * Custom study decks CRUD (premium-gated on the server). Mirrors mobile
 * `lib/decks.ts`. The list query uses retry:false so a 402/403 surfaces
 * quickly and the page can render a locked state via `isPremiumError`.
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

export type Deck = {
  id: string;
  environmentId: string;
  title: string;
  description: string | null;
  focusPrompt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeckBody = {
  title: string;
  description?: string | null;
  focusPrompt: string;
};

export type UpdateDeckBody = {
  title?: string;
  description?: string | null;
  focusPrompt?: string;
};

export const decksQueryKey = (envId: string) => ["env", envId, "decks"] as const;

export function useListDecks(envId: string): UseQueryResult<Deck[]> {
  const authReady = useAuthReady();
  return useQuery<Deck[]>({
    queryKey: decksQueryKey(envId),
    enabled: authReady && !!envId,
    staleTime: 60_000,
    retry: false,
    queryFn: () =>
      customFetch<Deck[]>(`/api/environments/${encodeURIComponent(envId)}/decks`),
  });
}

export function useCreateDeck(
  envId: string,
): UseMutationResult<Deck, Error, CreateDeckBody> {
  const qc = useQueryClient();
  return useMutation<Deck, Error, CreateDeckBody>({
    mutationFn: (body) =>
      customFetch<Deck>(`/api/environments/${encodeURIComponent(envId)}/decks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: decksQueryKey(envId) }),
  });
}

export function useUpdateDeck(
  envId: string,
): UseMutationResult<Deck, Error, { deckId: string; data: UpdateDeckBody }> {
  const qc = useQueryClient();
  return useMutation<Deck, Error, { deckId: string; data: UpdateDeckBody }>({
    mutationFn: ({ deckId, data }) =>
      customFetch<Deck>(
        `/api/environments/${encodeURIComponent(envId)}/decks/${encodeURIComponent(deckId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: decksQueryKey(envId) }),
  });
}

export function useDeleteDeck(
  envId: string,
): UseMutationResult<void, Error, { deckId: string }> {
  const qc = useQueryClient();
  return useMutation<void, Error, { deckId: string }>({
    mutationFn: async ({ deckId }) => {
      await customFetch<void>(
        `/api/environments/${encodeURIComponent(envId)}/decks/${encodeURIComponent(deckId)}`,
        { method: "DELETE" },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: decksQueryKey(envId) }),
  });
}
