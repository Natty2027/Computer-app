import { Lock, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown when a premium-gated feature (Stats, Decks) returns a 402/403.
 * There's no purchase flow on web, so this is an informational upsell that
 * points users at the mobile app / their subscription.
 */
export function LockedFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-brand/30 bg-brand-soft">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-brand-foreground shadow-[var(--shadow-brand)]">
          <Lock className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand">
          <Sparkles className="h-4 w-4" /> Available with Cognivate Premium
        </p>
      </CardContent>
    </Card>
  );
}
