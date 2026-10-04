import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function MatchBadge({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground shadow-sm",
        className,
      )}
    >
      <Check className="size-3" strokeWidth={3} />
      {value}% phù hợp
    </span>
  );
}
