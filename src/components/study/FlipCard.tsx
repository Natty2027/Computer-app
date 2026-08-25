import { cn } from "@/lib/utils";

type FlipCardProps = {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped: boolean;
  onFlip?: () => void;
  className?: string;
};

/**
 * A 3D flip card. `flipped` is controlled by the parent so review/flashcard
 * flows can drive it (tap to reveal the answer). Both faces share the same
 * footprint so the card doesn't jump on flip.
 */
export function FlipCard({ front, back, flipped, onFlip, className }: FlipCardProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className={cn(
        "group block w-full text-left [perspective:1600px]",
        className,
      )}
      aria-pressed={flipped}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-low)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-8 text-center shadow-[var(--shadow-low)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </div>
    </button>
  );
}
