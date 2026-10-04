import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= Math.round(value) ? "fill-primary text-primary" : "fill-muted text-muted",
          )}
        />
      ))}
    </span>
  );
}
