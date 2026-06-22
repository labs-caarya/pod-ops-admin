import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { Tone } from "./Badge";

const accent: Record<Tone, string> = {
  ruby: "text-ruby-bright",
  amber: "text-amber-bright",
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-info",
  muted: "text-ink-muted",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "ruby",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", accent[tone])} />}
      </div>
      <div className="mt-2 font-display text-2xl font-black text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </Card>
  );
}
