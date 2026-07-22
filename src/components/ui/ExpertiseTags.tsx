import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const DEFAULT_VISIBLE = 3;

export function ExpertiseTags({
  tags,
  visibleCount = DEFAULT_VISIBLE,
  className,
}: {
  tags: string[];
  visibleCount?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!tags.length) {
    return <span className="text-xs text-ink-faint">No expertise listed</span>;
  }

  const hiddenCount = Math.max(tags.length - visibleCount, 0);
  const shown = expanded ? tags : tags.slice(0, visibleCount);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((tag) => (
        <Badge key={tag} tone="muted" className="text-[10px]">
          {tag}
        </Badge>
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-medium text-ruby-bright hover:underline"
        >
          +{hiddenCount} more
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-medium text-ink-muted hover:underline"
        >
          View less
        </button>
      )}
    </div>
  );
}
