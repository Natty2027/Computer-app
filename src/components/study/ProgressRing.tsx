import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** 0..1 fraction filled. */
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
  /** Content rendered centered inside the ring. */
  children?: React.ReactNode;
};

/**
 * Circular progress ring (level/XP indicator). Track uses the muted color,
 * the arc uses the brand indigo. Mirrors the mobile ProgressRing.
 */
export function ProgressRing({
  progress,
  size = 40,
  stroke = 4,
  className,
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped);
  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-brand transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      )}
    </div>
  );
}
