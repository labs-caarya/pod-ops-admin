import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-ink-faint">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "ruby",
}: {
  value: number;
  className?: string;
  tone?: "ruby" | "amber" | "good";
}) {
  const fill =
    tone === "amber"
      ? "from-amber to-amber-bright"
      : tone === "good"
        ? "from-good to-good"
        : "from-ruby to-amber";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all", fill)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Avatar({ name, color, className }: { name: string; color?: string; className?: string }) {
  const init = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        className || "h-9 w-9",
      )}
      style={{ background: color || "linear-gradient(135deg, #fb3a63, #f59e0b)" }}
    >
      {init}
    </div>
  );
}
