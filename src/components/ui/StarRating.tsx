import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  label,
  size = "sm",
}: {
  value: number;
  label: string;
  size?: "sm" | "md";
}) {
  const score = Math.max(0, Math.min(5, Math.round(value)));
  const iconClass = size === "md" ? "h-4 w-4" : "h-3 w-3";

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${label}: ${score} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            iconClass,
            index < score ? "fill-amber text-amber-bright" : "fill-none text-ink-faint",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}
