/**
 * Simplify — rewrite study material into plainer language at a chosen
 * reading level. Ported from the mobile app (artifacts/cognivate-mobile/
 * lib/simplify.ts) so the web has feature parity.
 *
 * Reuses the already-deployed `/environments/:id/explain` endpoint rather
 * than adding a server route: that endpoint sends the passage to Claude
 * grounded in the user's uploaded material and returns a plain-language
 * rewrite in its `explanation` field. The reading level is steered
 * through the `context` field, which the server splices into the prompt.
 * No server change is required.
 */
import { customFetch } from "@workspace/api-client-react";

export type SimplifyLevel = "simple" | "plain" | "exam";

export const SIMPLIFY_LEVELS: {
  id: SimplifyLevel;
  label: string;
  blurb: string;
}[] = [
  {
    id: "simple",
    label: "Simple",
    blurb:
      "Everyday words and a concrete example, as if explaining to a curious beginner.",
  },
  {
    id: "plain",
    label: "Plain English",
    blurb:
      "The same ideas in shorter sentences, with any jargon explained the first time it appears.",
  },
  {
    id: "exam",
    label: "Exam ready",
    blurb:
      "Tightened for revision: the definition, when it applies, and the most common mistake.",
  },
];

const LEVEL_INSTRUCTION: Record<SimplifyLevel, string> = {
  simple:
    "Rewrite it for a curious beginner using everyday words and short sentences, and include one concrete, familiar example. Never use a technical term without immediately saying what it means in plain words.",
  plain:
    "Rewrite it in plain English for someone new to the topic. Keep the technical terms the text uses, but define each one the first time it appears. Prefer short sentences and the active voice.",
  exam:
    "Rewrite it as tight revision notes: lead with the definition or rule, then when it applies, then the single most common mistake. Be precise and compact; do not pad.",
};

export type SimplifyResult = {
  explanation: string;
  sourceStatus?: string;
  sourceReferences?: unknown[];
};

/**
 * Ask the backend to simplify `text` at the given reading level.
 */
export async function simplifyText(args: {
  envId: string;
  text: string;
  level: SimplifyLevel;
}): Promise<SimplifyResult> {
  const context =
    `The reader wants this passage made easier to understand. ${LEVEL_INSTRUCTION[args.level]} ` +
    "Keep the meaning exact and only use information present in the selected text and the uploaded material — do not add new facts. " +
    'Put the full rewrite in the "explanation" field.';

  return await customFetch<SimplifyResult>(
    `/api/environments/${encodeURIComponent(args.envId)}/explain`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: args.text, context }),
    },
  );
}
