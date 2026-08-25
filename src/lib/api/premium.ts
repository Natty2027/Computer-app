/**
 * Premium gating helpers. The backend enforces premium features (Stats,
 * Decks, practice daily quota) and responds with 402/403. We don't run a
 * purchase flow on web — instead we detect that response and render a
 * locked/upsell card.
 */

/** The shape `customFetch` throws on a non-2xx response (see ApiError). */
type MaybeApiError = {
  status?: number;
  data?: unknown;
};

function errorCode(err: unknown): string | null {
  const data = (err as MaybeApiError)?.data;
  if (data && typeof data === "object") {
    const code = (data as Record<string, unknown>).code;
    if (typeof code === "string") return code;
  }
  return null;
}

/** True when the error is a payment/authorization gate (premium required). */
export function isPremiumError(err: unknown): boolean {
  const status = (err as MaybeApiError)?.status;
  return status === 402 || status === 403;
}

/** True specifically when the free-tier daily practice limit was hit. */
export function isDailyLimitError(err: unknown): boolean {
  return (
    (err as MaybeApiError)?.status === 402 &&
    errorCode(err) === "DAILY_PRACTICE_LIMIT"
  );
}
