import { Button } from "@/components/ui/button";
import type { ReviewGrade } from "@/lib/api/review";
import { cn } from "@/lib/utils";

const GRADES: { grade: ReviewGrade; label: string; classes: string }[] = [
  { grade: "again", label: "Again", classes: "bg-destructive text-destructive-foreground hover:opacity-90" },
  { grade: "hard", label: "Hard", classes: "bg-warning text-warning-foreground hover:opacity-90" },
  { grade: "good", label: "Good", classes: "bg-primary text-primary-foreground hover:opacity-90" },
  { grade: "easy", label: "Easy", classes: "bg-success text-success-foreground hover:opacity-90" },
];

/**
 * The four SM-2 grade buttons (Again / Hard / Good / Easy). Colored by
 * difficulty to match the mobile grading row.
 */
export function GradeButtons({
  onGrade,
  disabled,
  className,
}: {
  onGrade: (grade: ReviewGrade) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {GRADES.map(({ grade, label, classes }) => (
        <Button
          key={grade}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(grade)}
          className={cn("h-11 font-semibold", classes)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
