import { cn } from "@/lib/utils";

export type Tone = "ruby" | "amber" | "good" | "warn" | "bad" | "info" | "muted";

const tones: Record<Tone, string> = {
  ruby: "bg-ruby/15 text-ruby-bright border-ruby/30",
  amber: "bg-amber/15 text-amber-bright border-amber/30",
  good: "bg-good/15 text-good border-good/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  bad: "bg-bad/15 text-bad border-bad/30",
  info: "bg-info/15 text-info border-info/30",
  muted: "bg-surface-3 text-ink-muted border-line",
};

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
