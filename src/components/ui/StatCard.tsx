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

function statLabelClass(label: string) {
  if (label.length > 24) return "text-[8px] tracking-[0.04em]";
  if (label.length > 18) return "text-[9px] tracking-[0.06em]";
  if (label.length > 14) return "text-[10px] tracking-[0.08em]";
  return "text-xs tracking-wide";
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "ruby",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("font-display text-2xl font-black leading-none text-ink", accent[tone])}>{value}</div>
        {Icon && <Icon className={cn("h-4 w-4 shrink-0 opacity-80", accent[tone])} />}
      </div>
      <div title={label} className={cn("mt-2 whitespace-nowrap font-medium uppercase leading-none text-ink-faint", statLabelClass(label))}>{label}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </Card>
  );
}
